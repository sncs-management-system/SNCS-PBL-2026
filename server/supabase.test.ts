import { afterEach, expect, it, vi } from 'vitest';
import { supabaseStore } from './supabase';
import { validApplication } from '../src/lib/enrollment/fixtures';

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
it('sends normalized application and guardian records to the schema-aligned RPC', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ reference: 'SNCS-TEST', created: true }), { headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', fetchMock);
  await supabaseStore('https://example.supabase.co', 'test-key').save({ submissionId: 'test', periodId: '1', ipHash: 'test-hash', data: validApplication, attachment: null, attachmentPath: null });
  expect(String(fetchMock.mock.calls[0][0])).toContain('/rpc/submit_pb12_enrollment');
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.p_application).toMatchObject({ department: 'jhs', mode_of_payment: 'monthly', period_id: '1', strand: null });
  expect(body.p_privacy_consent).toBe(true);
  expect(body.p_guardians[0]).toMatchObject({ full_name: 'Guardian Example', relationship: 'guardian' });
});
