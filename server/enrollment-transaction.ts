import { SubmissionError, type SaveInput, type Receipt } from './app.js';
import { mapEnrollment } from './enrollment-mapping.js';
import { ServiceError } from './service-error.js';

export interface TransactionClient {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

// Only parameterized reads/inserts and transaction-scoped locks. No DDL,
// permission changes, stored functions, or additional tables are needed.
export async function saveEnrollment(client: TransactionClient, input: SaveInput): Promise<Receipt> {
  const mapped = mapEnrollment(input.data, input.periodId);
  const reference = `SNCS-${input.submissionId.replaceAll('-', '').toUpperCase()}`;
  try {
    await client.query('begin');
    await client.query("set local lock_timeout = '5s'");
    await client.query("set local statement_timeout = '10s'");
    const period = (await client.query('select status, school_year from public.enrollment_periods where id = $1 for share', [input.periodId])).rows[0];
    if (period?.status !== 'open' || period.school_year !== input.data.schoolYear) throw new SubmissionError('closed');
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [input.ipHash]);
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 1))', [reference]);
    const existing = (await client.query(`select id::text, submitter_ip_hash,
      to_jsonb(a) || jsonb_build_object('period_id', a.period_id::text) as application
      from public.enrollment_applications a where reference_no = $1`, [reference])).rows[0];
    if (existing) {
      const application = existing.application as Record<string, unknown>;
      const guardians = (await client.query('select relationship, full_name, occupation, contact_number from public.application_guardians where application_id = $1 order by relationship', [existing.id])).rows;
      const sameGuardians = guardians.length === mapped.guardians.length && mapped.guardians.every(expected =>
        guardians.some(saved => Object.entries(expected).every(([key, value]) => saved[key] === value)));
      if (existing.submitter_ip_hash !== input.ipHash || !sameGuardians ||
        !Object.entries(mapped.application).every(([key, value]) => application[key] === value)) throw new SubmissionError('conflict');
      await client.query('commit');
      return { reference, created: false };
    }
    const count = (await client.query("select count(*)::int as count from public.enrollment_applications where submitter_ip_hash = $1 and submitted_at > now() - interval '1 hour'", [input.ipHash])).rows[0];
    if (Number(count?.count) >= 5) throw new SubmissionError('rate_limit');
    // Column names are from the fixed server mapping, never client input.
    const entries = Object.entries(mapped.application);
    const columns = entries.map(([column]) => column).join(', ');
    const placeholders = entries.map((_, index) => `$${index + 3}`).join(', ');
    const saved = (await client.query(`insert into public.enrollment_applications
      (reference_no, submitter_ip_hash, ${columns}, status, privacy_consent_at)
      values ($1, $2, ${placeholders}, 'pending', now()) returning id::text`,
    [reference, input.ipHash, ...entries.map(([, value]) => value)])).rows[0];
    for (const guardian of mapped.guardians) {
      await client.query(`insert into public.application_guardians
        (application_id, relationship, full_name, occupation, contact_number) values ($1, $2, $3, $4, $5)`,
      [saved.id, guardian.relationship, guardian.full_name, guardian.occupation, guardian.contact_number]);
    }
    await client.query('commit');
    return { reference, created: true };
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    if (error instanceof SubmissionError) throw error;
    throw new ServiceError('Application save failed', error && typeof error === 'object' && 'code' in error ? error.code : undefined, 'database_transaction');
  }
}
