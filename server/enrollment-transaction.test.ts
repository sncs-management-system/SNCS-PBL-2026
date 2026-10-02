import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { validApplication } from '../src/lib/enrollment/fixtures';
import { saveEnrollment, type TransactionClient } from './enrollment-transaction';
import type { Application } from '../src/lib/enrollment/form';

describe('PB-12 transaction against the unchanged team schema', () => {
  let db: PGlite;
  let client: TransactionClient;
  let originalStructure: unknown;
  let originalSecurity: unknown;
  let originalIndexes: unknown;
  const structure = () => db.query(`select table_name, column_name, data_type from information_schema.columns
    where table_schema = 'public' order by table_name, ordinal_position`);
  beforeAll(async () => {
    db = new PGlite();
    client = { query: (text, values) => db.query(text, values) };
    const schema = readFileSync(new URL('../supabase/reference/SNCS_Schema_Final.sql', import.meta.url), 'utf8');
    await db.exec(schema.slice(schema.indexOf('CREATE TABLE users ('), schema.indexOf('CREATE TABLE sessions (')));
    await db.exec(schema.slice(schema.indexOf('CREATE TABLE enrollment_periods ('), schema.indexOf('-- 4. SCHEDULING')));
    await db.exec(`do $$ declare t text; begin for t in select tablename from pg_tables where schemaname = 'public'
      loop execute format('alter table public.%I enable row level security', t); end loop; end $$;`);
    await db.exec("insert into enrollment_periods (school_year, status) values ('2026-2027', 'open')");
    originalStructure = (await structure()).rows;
    originalSecurity = (await db.query("select relname, relrowsecurity, relacl from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname")).rows;
    originalIndexes = (await db.query("select indexname, indexdef from pg_indexes where schemaname = 'public' order by indexname")).rows;
  }, 30_000);
  beforeEach(async () => {
    await db.exec("truncate public.enrollment_applications cascade; update public.enrollment_periods set status = 'closed'; update public.enrollment_periods set status = 'open', school_year = '2026-2027' where id = 1");
  });
  afterAll(async () => { await db?.close(); });
  const submit = (id = randomUUID(), ipHash = 'test-ip', data: Application = validApplication, periodId = '1') =>
    saveEnrollment(client, { submissionId: id, ipHash, data, periodId });

  it('saves application and guardians without changing schema or adding helper objects', async () => {
    const first = await submit();
    expect(first.reference).toMatch(/^SNCS-[A-F0-9]{32}$/);
    const app = (await db.query<Record<string, unknown>>('select * from enrollment_applications')).rows[0];
    expect(app).toMatchObject({ department: 'jhs', applicant_type: 'new', mode_of_payment: 'monthly', status: 'pending', strand: null, submitter_ip_hash: 'test-ip' });
    expect(app.privacy_consent_at).toBeTruthy(); expect(app.registrar_remarks).toBeNull();
    expect((await db.query('select relationship, full_name from application_guardians')).rows).toEqual([{ relationship: 'guardian', full_name: 'Guardian Example' }]);
    expect((await structure()).rows).toEqual(originalStructure);
    expect((await db.query("select relname, relrowsecurity, relacl from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname")).rows).toEqual(originalSecurity);
    expect((await db.query("select indexname, indexdef from pg_indexes where schemaname = 'public' order by indexname")).rows).toEqual(originalIndexes);
    expect((await db.query("select to_regclass('public.enrollment_submission_receipts') as helper, to_regprocedure('public.submit_pb12_enrollment(uuid,text,jsonb,jsonb,text,boolean,jsonb,text)') as rpc")).rows[0]).toEqual({ helper: null, rpc: null });
    expect((await db.query('select * from application_documents')).rows).toEqual([]);
  });
  it('enforces the rolling rate limit and permits identical retries after five saves', async () => {
    const id = randomUUID(); const first = await submit(id);
    for (let i = 0; i < 4; i++) await submit();
    await expect(submit()).rejects.toMatchObject({ code: 'rate_limit' });
    expect(await submit(id)).toEqual({ ...first, created: false });
    await expect(submit(randomUUID(), 'other-ip')).resolves.toBeTruthy();
    await db.exec("update enrollment_applications set submitted_at = now() - interval '61 minutes'");
    await expect(submit()).resolves.toBeTruthy();
  });
  it('rejects retry identifiers reused with different student, parent, period or IP details', async () => {
    const id = randomUUID(); await submit(id);
    await expect(submit(id, 'other-ip')).rejects.toMatchObject({ code: 'conflict' });
    await expect(submit(id, 'test-ip', { ...validApplication, firstName: 'Changed' })).rejects.toMatchObject({ code: 'conflict' });
    await expect(submit(id, 'test-ip', { ...validApplication, guardianContact: '09981234567' })).rejects.toMatchObject({ code: 'conflict' });
    await db.exec("update enrollment_periods set status = 'closed'; insert into enrollment_periods (school_year, status) values ('2026-2027', 'open')");
    await expect(submit(id, 'test-ip', validApplication, '2')).rejects.toMatchObject({ code: 'conflict' });
    expect((await db.query('select id from enrollment_applications')).rows).toHaveLength(1);
  });
  it('rejects closed, nonexistent and changed-year periods', async () => {
    await expect(submit(undefined, undefined, validApplication, '999')).rejects.toMatchObject({ code: 'closed' });
    await db.exec("update enrollment_periods set status = 'closed'");
    await expect(submit()).rejects.toMatchObject({ code: 'closed' });
    await db.exec("update enrollment_periods set status = 'open', school_year = '2027-2028' where id = 1");
    await expect(submit()).rejects.toMatchObject({ code: 'closed' });
    expect((await db.query('select id from enrollment_applications')).rows).toEqual([]);
  });
  it.each([
    ['Preschool', 'Nursery', 'preschool', null], ['Preschool', 'Kindergarten', 'preschool', null],
    ['Elementary', 'Grade 1', 'grade_school', null], ['JHS', 'Grade 10', 'jhs', null], ['SHS', 'Grade 12', 'shs', '12-STEM'],
  ])('maps %s %s into the original columns', async (level, gradeLevel, department, strand) => {
    await submit(undefined, undefined, { ...validApplication, level, gradeLevel, strand: strand ?? '' });
    expect((await db.query('select department, grade_level, strand from enrollment_applications')).rows[0]).toEqual({ department, grade_level: gradeLevel, strand });
  });
  it('rolls back the application when a guardian insert fails', async () => {
    let inserts = 0;
    const failing: TransactionClient = { query: (text, values) => {
      if (text.includes('insert into public.application_guardians') && ++inserts === 2) throw new Error('simulated failure with private details');
      return client.query(text, values);
    } };
    await expect(saveEnrollment(failing, { submissionId: randomUUID(), periodId: '1', ipHash: 'test-ip', data: { ...validApplication, fatherFullName: 'Father Example' } })).rejects.toThrow('Application save failed');
    expect((await db.query('select id from enrollment_applications')).rows).toEqual([]);
    expect((await db.query('select id from application_guardians')).rows).toEqual([]);
  });
  it('uses parameterized values for quotes and SQL-shaped field contents', async () => {
    await submit(undefined, undefined, { ...validApplication, surname: "O'Connor", address: "Street'); drop table users; --" });
    expect((await db.query('select surname, complete_address from enrollment_applications')).rows[0]).toMatchObject({ surname: "O'Connor", complete_address: "Street'); drop table users; --" });
    expect((await structure()).rows).toEqual(originalStructure);
  });
});
