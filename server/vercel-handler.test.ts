import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validApplication } from '../src/lib/enrollment/fixtures';
import { createVercelHandler } from './vercel-handler';

const { store, verify } = vi.hoisted(() => ({
  store: { period: vi.fn(), save: vi.fn(), upload: vi.fn(), remove: vi.fn() },
  verify: vi.fn(),
}));
vi.mock('./supabase', () => ({ supabaseStore: vi.fn(() => store) }));
vi.mock('./turnstile', () => ({ verifyTurnstile: verify }));

describe('Vercel enrollment functions', () => {
  const origin = 'https://branch.school.example';
  const ip = '203.0.113.17';
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-only-supabase-key');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'server-only-turnstile-key');
    vi.stubEnv('TURNSTILE_SITE_KEY', 'public-site-key');
    vi.stubEnv('TURNSTILE_HOSTNAME', 'branch.school.example');
    vi.stubEnv('APP_ORIGIN', origin);
    vi.stubEnv('IP_HASH_SECRET', 'x'.repeat(32));
    store.period.mockResolvedValue({ status: 'open', schoolYear: '2026-2027', periodId: '1' });
    store.save.mockResolvedValue({ reference: 'SNCS-TEST', created: true });
    verify.mockResolvedValue(true);
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  const post = (handler = createVercelHandler()) => request(handler).post('/api/enrollment/applications')
    .set('Origin', origin).set('x-vercel-forwarded-for', ip)
    .field('application', JSON.stringify({ ...validApplication, periodId: '1', privacyConsent: true }))
    .field('captchaToken', 'valid-token').field('submissionId', randomUUID());

  it('serves public configuration through the actual /api entry point', async () => {
    const { default: handler } = await import('../api/enrollment/config');
    const response = await request(handler).get('/api/enrollment/config').expect(200);
    expect(response.body).toEqual({ status: 'open', schoolYear: '2026-2027', periodId: '1', siteKey: 'public-site-key' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.text).not.toContain('server-only');
  });

  it('handles multipart submission and hashes the platform client IP', async () => {
    const { default: handler } = await import('../api/enrollment/applications');
    const response = await post(handler).set('x-forwarded-for', '192.0.2.99')
      .attach('attachment', Buffer.from('%PDF-1.4\nexample'), { filename: 'example.pdf', contentType: 'application/pdf' }).expect(201);
    expect(response.body.reference).toBe('SNCS-TEST');
    expect(verify).toHaveBeenCalledWith('server-only-turnstile-key', 'branch.school.example', 'valid-token', ip);
    expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ ipHash: createHmac('sha256', 'x'.repeat(32)).update(ip).digest('hex') }));
    expect(store.upload).toHaveBeenCalledOnce();
  });

  it('rejects foreign origins and invalid platform IPs before persistence', async () => {
    await post().set('Origin', 'https://other.example').expect(403);
    await post().set('x-vercel-forwarded-for', 'invalid').expect(503);
    expect(store.save).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });

  it('returns safe configuration failures and retries initialization after a missing setting', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    const handler = createVercelHandler();
    const response = await request(handler).get('/api/enrollment/config').expect(503);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.text).not.toContain('SUPABASE');
    expect(log).toHaveBeenCalledWith('Missing required setting: TURNSTILE_SECRET_KEY');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'server-only-turnstile-key');
    await request(handler).get('/api/enrollment/config').expect(200);
  });

  it('rejects an origin that cannot match Turnstile hostname validation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubEnv('APP_ORIGIN', `${origin}/`);
    await request(createVercelHandler()).get('/api/enrollment/config').expect(503);
    vi.stubEnv('APP_ORIGIN', 'https://wrong.school.example');
    await request(createVercelHandler()).get('/api/enrollment/config').expect(503);
    expect(store.period).not.toHaveBeenCalled();
  });
});
