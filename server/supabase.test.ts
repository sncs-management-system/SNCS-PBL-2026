import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { supabaseStore } from './supabase';
import { validApplication } from '../src/lib/enrollment/fixtures';

const { query, release, connect, PoolMock } = vi.hoisted(() => {
  const query = vi.fn(); const release = vi.fn();
  const connect = vi.fn(() => Promise.resolve({ query, release }));
  const PoolMock = vi.fn(function (config: { connectionString: string }) { void config; return { connect, on: vi.fn() }; });
  return { query, release, connect, PoolMock };
});
vi.mock('pg', () => ({ Pool: PoolMock }));
beforeEach(() => {
  vi.clearAllMocks();
  connect.mockResolvedValue({ query, release });
  query.mockImplementation(async (text: string) => ({ rows: text.startsWith('select status') ? [{ status: 'open', school_year: '2026-2027' }]
    : text.startsWith('select count') ? [{ count: 0 }] : text.startsWith('insert into public.enrollment_applications') ? [{ id: '1' }] : [] }));
});

afterEach(() => vi.unstubAllGlobals());
it('reads the open team enrollment period and preserves bigint IDs as text', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: '9007199254740993', school_year: '2026-2027', status: 'open' }]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', fetchMock);
  const result = await supabaseStore('https://example.supabase.co', 'test-key').period();
  expect(result).toEqual({ periodId: '9007199254740993', schoolYear: '2026-2027', status: 'open' });
  const url = new URL(String(fetchMock.mock.calls[0][0]));
  expect(url.pathname).toBe('/rest/v1/enrollment_periods');
  expect(url.searchParams.get('select')).toBe('id::text,status,school_year');
  expect(url.searchParams.get('status')).toBe('eq.open');
});
it('treats no open period as closed, and distinguishes a database error', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response('[]', { headers: { 'Content-Type': 'application/json' } }))
    .mockResolvedValue(new Response(JSON.stringify({ message: 'unavailable' }), { status: 503 }));
  vi.stubGlobal('fetch', fetchMock);
  const store = supabaseStore('https://example.supabase.co', 'test-key');
  expect(await store.period()).toEqual({ status: 'closed', schoolYear: '', periodId: null });
  await expect(store.period()).rejects.toThrow('Enrollment configuration unavailable');
});
it('uses one verified TLS pool connection for the transaction and releases it', async () => {
  const result = await supabaseStore('https://example.supabase.co', 'test-key', 'postgresql://user:password@pool.example:6543/postgres?sslmode=no-verify').save({ submissionId: 'test', periodId: '1', ipHash: 'test-hash', data: validApplication });
  expect(result.created).toBe(true);
  expect(PoolMock).toHaveBeenCalledWith(expect.objectContaining({ ssl: { rejectUnauthorized: true }, max: 2 }));
  expect(PoolMock.mock.calls[0]?.[0].connectionString).not.toContain('sslmode');
  expect(query.mock.calls[0][0]).toBe('begin');
  expect(query.mock.calls.at(-1)?.[0]).toBe('commit');
  expect(release).toHaveBeenCalledWith(false);
});
it('fails safely when the server database URL has not been configured', async () => {
  await expect(supabaseStore('https://example.supabase.co', 'test-key').save({ submissionId: 'test', periodId: '1', ipHash: 'test-hash', data: validApplication })).rejects.toMatchObject({ providerCode: 'DBURL' });
  expect(connect).not.toHaveBeenCalled();
});
it('rolls back and discards a failed connection without retaining database messages', async () => {
  query.mockRejectedValueOnce({ code: '23503', message: 'private applicant details', detail: 'private SQL' });
  const failure = await supabaseStore('https://example.supabase.co', 'test-key', 'postgresql://user:password@pool.example:6543/postgres').save({ submissionId: 'test', periodId: '1', ipHash: 'test-hash', data: validApplication }).catch(error => error);
  expect(failure).toMatchObject({ message: 'Application save failed', providerCode: '23503' });
  expect(query).toHaveBeenLastCalledWith('rollback');
  expect(release).toHaveBeenCalledWith(true);
  expect(JSON.stringify(failure)).not.toContain('private');
});
it('checks database reachability with SELECT 1 before returning enrollment availability', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: '1', status: 'open', school_year: '2026' }]), { headers: { 'Content-Type': 'application/json' } })));
  expect(await supabaseStore('https://example.supabase.co', 'test-key', 'postgresql://user:password@pool.example:6543/postgres').period()).toMatchObject({ status: 'open' });
  expect(query).toHaveBeenCalledExactlyOnceWith('select 1');
  expect(release).toHaveBeenCalledWith(false);
});
it('retains a known TLS failure code while discarding the connection URL and message', async () => {
  connect.mockRejectedValueOnce(Object.assign(new Error('private password in provider message'), { code: 'SELF_SIGNED_CERT_IN_CHAIN' }));
  const failure = await supabaseStore('https://example.supabase.co', 'test-key', 'postgresql://user:private-password@pool.example:6543/postgres').period().catch(error => error);
  expect(failure).toMatchObject({ component: 'database_connection', providerCode: 'SELF_SIGNED_CERT_IN_CHAIN' });
  expect(JSON.stringify(failure)).not.toContain('private');
  expect(query).not.toHaveBeenCalled();
});
it.each(['not-a-database-url', 'https://wrong.example'])('rejects a malformed connection string without returning its value', async url => {
  const failure = await supabaseStore('https://example.supabase.co', 'test-key', url).period().catch(error => error);
  expect(failure.component).toBe('database_connection');
  expect(['DBFMT', 'ERR_INVALID_URL']).toContain(failure.providerCode);
  expect(JSON.stringify(failure)).not.toContain(url);
  expect(connect).not.toHaveBeenCalled();
});
