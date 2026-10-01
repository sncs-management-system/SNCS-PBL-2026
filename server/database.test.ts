import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { validApplication } from '../src/lib/enrollment/fixtures';
import { mapEnrollment } from './enrollment-mapping';
import type { Application } from '../src/lib/enrollment/form';

describe('PB-12 PostgreSQL migration and submission transaction', () => {
  let db: PGlite;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema storage; create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
    // Execute the exact relevant DDL from the supplied schema, not a rewritten fixture.
    // Scheduling extensions and unrelated tables are outside this integration test.
    const schema = readFileSync(new URL('../supabase/reference/SNCS_Schema_Final.sql', import.meta.url), 'utf8');
    await db.exec(schema.slice(schema.indexOf('CREATE TABLE users ('), schema.indexOf('CREATE TABLE sessions (')));
    await db.exec(schema.slice(schema.indexOf('CREATE TABLE enrollment_periods ('), schema.indexOf('-- 4. SCHEDULING')));
    await db.exec(readFileSync(new URL('../supabase/migrations/202610010002_pb12_schema_alignment.sql', import.meta.url), 'utf8'));
    await db.exec("insert into enrollment_periods (school_year, status) values ('2026-2027', 'open')");
  }, 30_000);
  beforeEach(async () => {
    await db.exec("truncate public.enrollment_applications cascade; update public.enrollment_periods set status = 'open', school_year = '2026-2027' where id = 1");
  });
  afterAll(async () => { await db?.close(); });
  async function submit(id = randomUUID(), ip = 'test-ip', data: Application = validApplication, options: { consent?: boolean; path?: string; periodId?: string; duplicateGuardian?: boolean } = {}) {
    const mapped = mapEnrollment(data, options.periodId ?? '1');
    if (options.duplicateGuardian) mapped.guardians.push(mapped.guardians[0]);
    const result = await db.query<{ receipt: { reference: string; created: boolean } }>(
      'select public.submit_pb12_enrollment($1, $2, $3, $4, $5, $6, $7, $8) as receipt',
      [id, ip, JSON.stringify(mapped.application), JSON.stringify(mapped.guardians), data.schoolYear, options.consent ?? true,
        options.path ? JSON.stringify({ sha256: 'test-digest' }) : null, options.path ?? null]);
    return result.rows[0].receipt;
  }
  it('stores Pending and gives unique references', async () => {
    const first = await submit(); const second = await submit();
    expect(first.reference).toMatch(/^SNCS-[A-F0-9]{32}$/); expect(second.reference).not.toBe(first.reference);
    const rows = await db.query<{ status: string }>('select status from public.enrollment_applications');
    expect(rows.rows.map(row => row.status)).toEqual(['pending', 'pending']);
  });
  it('accepts five per rolling hour, rejects six, and permits another IP', async () => {
    for (let i = 0; i < 5; i++) await submit();
    await expect(submit()).rejects.toThrow('RATE_LIMIT');
    await expect(submit(randomUUID(), 'another-ip')).resolves.toBeTruthy();
    await db.exec("update public.enrollment_applications set submitted_at = now() - interval '61 minutes'");
    await expect(submit()).resolves.toBeTruthy();
  });
  it('reuses receipts for identical retries without counting another submission', async () => {
    const id = randomUUID(); const first = await submit(id); const second = await submit(id);
    expect(second).toEqual({ ...first, created: false });
    await expect(submit(id, 'different-ip')).rejects.toThrow('SUBMISSION_CONFLICT');
    await expect(submit(id, 'test-ip', { ...validApplication, firstName: 'Changed' })).rejects.toThrow('SUBMISSION_CONFLICT');
    expect((await db.query<{ count: number }>('select count(*)::int as count from public.enrollment_applications')).rows[0].count).toBe(1);
  });
  it('rejects closed periods and stale school years in the database', async () => {
    await db.exec("update public.enrollment_periods set status = 'closed'");
    await expect(submit()).rejects.toThrow('ENROLLMENT_CLOSED');
    await db.exec("update public.enrollment_periods set status = 'open', school_year = '2027-2028'");
    await expect(submit()).rejects.toThrow('ENROLLMENT_CLOSED');
  });
  it('denies public table and function access and uses a private bucket', async () => {
    const grants = await db.query<{ table_access: boolean; function_access: boolean }>(`select has_table_privilege('anon', 'public.enrollment_applications', 'SELECT,INSERT') as table_access,
      has_function_privilege('authenticated', 'public.submit_pb12_enrollment(uuid,text,jsonb,jsonb,text,boolean,jsonb,text)', 'EXECUTE') as function_access`);
    expect(grants.rows[0]).toEqual({ table_access: false, function_access: false });
    expect((await db.query<{ public: boolean }>('select public from storage.buckets')).rows[0].public).toBe(false);
  });
  it('saves normalized JHS columns, guardian rows, consent time and linked documents', async () => {
    await submit(undefined, undefined, { ...validApplication, fatherFullName: 'Father Example', fatherOccupation: 'Teacher', motherFullName: 'Mother Maiden' }, { path: 'test/document' });
    const app = (await db.query<Record<string, unknown>>('select * from enrollment_applications')).rows[0];
    expect(app).toMatchObject({ department: 'jhs', applicant_type: 'new', mode_of_payment: 'monthly', gender: 'female', strand: null, guardian_messenger: 'Example Guardian', religion: 'Catholic', submitter_ip_hash: 'test-ip' });
    expect(app.privacy_consent_at).toBeTruthy(); expect(app.registrar_remarks).toBeNull();
    const guardians = (await db.query('select relationship, full_name, occupation from application_guardians order by relationship')).rows;
    expect(guardians).toEqual([
      { relationship: 'father', full_name: 'Father Example', occupation: 'Teacher' },
      { relationship: 'guardian', full_name: 'Guardian Example', occupation: null },
      { relationship: 'mother', full_name: 'Mother Maiden', occupation: null },
    ]);
    const doc = (await db.query('select * from application_documents')).rows[0];
    expect(doc).toMatchObject({ application_id: app.id, document_type: 'supporting_document', storage_path: 'test/document' });
  });
  it('supports SHS strands and leaves optional student/previous-school columns null', async () => {
    await submit(undefined, undefined, { ...validApplication, level: 'SHS', gradeLevel: 'Grade 12', strand: '12-STEM', previousSchool: '', previousAddress: '' });
    expect((await db.query('select department, strand, last_school_name, last_school_address, middle_name, parent_email from enrollment_applications')).rows[0])
      .toEqual({ department: 'shs', strand: '12-STEM', last_school_name: null, last_school_address: null, middle_name: null, parent_email: null });
  });
  it('rolls back every row if a related guardian violates a schema constraint', async () => {
    await expect(submit(undefined, undefined, validApplication, { duplicateGuardian: true })).rejects.toThrow();
    expect((await db.query('select id from enrollment_applications')).rows).toEqual([]);
    expect((await db.query('select id from application_guardians')).rows).toEqual([]);
    expect((await db.query('select submission_id from enrollment_submission_receipts')).rows).toEqual([]);
  });
  it('refuses missing consent and a nonexistent selected period without inserting', async () => {
    await expect(submit(undefined, undefined, validApplication, { consent: false })).rejects.toThrow('PRIVACY_CONSENT_REQUIRED');
    await expect(submit(undefined, undefined, validApplication, { periodId: '9999' })).rejects.toThrow('ENROLLMENT_CLOSED');
    expect((await db.query('select id from enrollment_applications')).rows).toEqual([]);
  });
  it('allows the service role to lock the period and atomically insert related records', async () => {
    await db.exec('set role service_role');
    try {
      expect((await submit(undefined, undefined, validApplication, { path: 'service/document' })).created).toBe(true);
    } finally { await db.exec('reset role'); }
  });
});
