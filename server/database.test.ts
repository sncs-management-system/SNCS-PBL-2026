import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { validApplication } from '../src/lib/enrollment/fixtures';

describe('PB-12 PostgreSQL migration and submission transaction', () => {
  let db: PGlite;
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema storage; create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
    await db.exec(readFileSync(new URL('../supabase/migrations/202610010001_pb12_enrollment.sql', import.meta.url), 'utf8'));
  }, 30_000);
  beforeEach(async () => {
    await db.exec("truncate public.enrollment_applications; update public.enrollment_settings set status = 'open', school_year = '2026-2027'");
  });
  afterAll(async () => { await db?.close(); });
  async function submit(id = randomUUID(), ip = 'test-ip', data = validApplication) {
    const result = await db.query<{ receipt: { reference: string; created: boolean } }>('select public.submit_enrollment_application($1, $2, $3, null, null) as receipt', [id, ip, JSON.stringify(data)]);
    return result.rows[0].receipt;
  }
  it('stores Pending and gives unique references', async () => {
    const first = await submit(); const second = await submit();
    expect(first.reference).toMatch(/^SNCS-[A-F0-9]{32}$/); expect(second.reference).not.toBe(first.reference);
    const rows = await db.query<{ status: string }>('select status from public.enrollment_applications');
    expect(rows.rows.map(row => row.status)).toEqual(['Pending', 'Pending']);
  });
  it('accepts five per rolling hour, rejects six, and permits another IP', async () => {
    for (let i = 0; i < 5; i++) await submit();
    await expect(submit()).rejects.toThrow('RATE_LIMIT');
    await expect(submit(randomUUID(), 'another-ip')).resolves.toBeTruthy();
    await db.exec("update public.enrollment_applications set created_at = now() - interval '61 minutes'");
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
    await db.exec("update public.enrollment_settings set status = 'closed'");
    await expect(submit()).rejects.toThrow('ENROLLMENT_CLOSED');
    await db.exec("update public.enrollment_settings set status = 'open', school_year = '2027-2028'");
    await expect(submit()).rejects.toThrow('ENROLLMENT_CLOSED');
  });
  it('denies public table and function access and uses a private bucket', async () => {
    const grants = await db.query<{ table_access: boolean; function_access: boolean }>(`select has_table_privilege('anon', 'public.enrollment_applications', 'SELECT,INSERT') as table_access,
      has_function_privilege('authenticated', 'public.submit_enrollment_application(uuid,text,jsonb,jsonb,text)', 'EXECUTE') as function_access`);
    expect(grants.rows[0]).toEqual({ table_access: false, function_access: false });
    expect((await db.query<{ public: boolean }>('select public from storage.buckets')).rows[0].public).toBe(false);
  });
});
