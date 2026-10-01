import { afterEach, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';
afterEach(() => vi.unstubAllGlobals());
it('requires a valid token for this hostname and the enrollment action', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, hostname: 'school.example', action: 'enrollment' }) });
  vi.stubGlobal('fetch', fetchMock);
  expect(await verifyTurnstile('secret', 'school.example', 'token', '127.0.0.1')).toBe(true);
  expect(await verifyTurnstile('secret', 'wrong.example', 'token', '127.0.0.1')).toBe(false);
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: false }) });
  expect(await verifyTurnstile('secret', 'school.example', 'expired', '127.0.0.1')).toBe(false);
});
