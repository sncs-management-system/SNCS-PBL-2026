import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, SubmissionError, type EnrollmentStore } from './app';
import { validApplication } from '../src/lib/enrollment/fixtures';
import { maxAttachmentBytes, sectionsFor } from '../src/lib/enrollment/form';

describe('enrollment HTTP API', () => {
  const store: EnrollmentStore = { period: vi.fn(), save: vi.fn(), upload: vi.fn(), remove: vi.fn() };
  const verify = vi.fn();
  const app = createApp(store, verify, { siteKey: 'public-key', ipHashSecret: 'a-long-test-secret', allowedOrigin: 'https://school.example' });
  const post = (data: Record<string, unknown> = { ...validApplication, periodId: '1', privacyConsent: true }, token = 'valid') => request(app).post('/api/enrollment/applications').field('application', JSON.stringify(data)).field('captchaToken', token).field('submissionId', randomUUID());
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(store.period).mockResolvedValue({ status: 'open', schoolYear: '2026-2027', periodId: '1' });
    vi.mocked(store.save).mockResolvedValue({ reference: 'SNCS-TEST', created: true });
    vi.mocked(store.upload).mockResolvedValue(undefined);
    vi.mocked(store.remove).mockResolvedValue(undefined);
    verify.mockResolvedValue(true);
  });
  it('returns public configuration without credentials', async () => {
    const response = await request(app).get('/api/enrollment/config');
    expect(response.body).toEqual({ status: 'open', schoolYear: '2026-2027', periodId: '1', siteKey: 'public-key' });
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('persists validated Pending applications and returns only a receipt', async () => {
    const response = await post().expect(201);
    expect(response.body).toMatchObject({ status: 'Pending', reference: 'SNCS-TEST' });
    expect(response.body.message).toContain('Registrar');
    expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ surname: 'Example' }), ipHash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(response.body.email).toBeUndefined();
  });
  it('blocks closed enrollment before CAPTCHA or persistence', async () => {
    vi.mocked(store.period).mockResolvedValue({ status: 'closed', schoolYear: '', periodId: null });
    await post().expect(403); expect(verify).not.toHaveBeenCalled(); expect(store.save).not.toHaveBeenCalled();
  });
  it('rejects forged fields and invalid optional files', async () => {
    const invalid = await post({ ...validApplication, periodId: '1', privacyConsent: true, email: 'bad' }).expect(422);
    expect(invalid.body.errors.email).toBeTruthy();
    await post().attach('attachment', Buffer.from('fake image'), { filename: 'fake.png', contentType: 'image/png' }).expect(422);
    expect(store.save).not.toHaveBeenCalled();
  });
  it.each(sectionsFor({ level: 'SHS', gradeLevel: 'Grade 11' }).flatMap(section => section.fields).filter(field => !field.readOnly))('rejects forged $key values before CAPTCHA, upload or database access', async field => {
    const result = await post({ ...validApplication, level: 'SHS', gradeLevel: 'Grade 11', strand: '11-ACADEMIC', periodId: '1', privacyConsent: true, [field.key]: 'x'.repeat(field.maxLength! + 1) }).expect(422);
    expect(result.body.errors[field.key]).toBeTruthy();
    expect(verify).not.toHaveBeenCalled(); expect(store.upload).not.toHaveBeenCalled(); expect(store.save).not.toHaveBeenCalled();
  });
  it.each(['contact', 'fatherContact', 'motherContact', 'guardianContact'])('rejects invalid %s even when browser restrictions are bypassed', async key => {
    for (const value of ['091712345678', '08171234567', '0917123456', '+639171234567', '09171234567,09981234567']) {
      const result = await post({ ...validApplication, periodId: '1', privacyConsent: true, [key]: value }).expect(422);
      expect(result.body.errors[key]).toBeTruthy();
    }
    expect(verify).not.toHaveBeenCalled(); expect(store.save).not.toHaveBeenCalled();
  });
  it.each(sectionsFor({ level: 'SHS', gradeLevel: 'Grade 11' }).flatMap(section => section.fields).filter(field => field.required))('rejects missing required $key at the API', async field => {
    const result = await post({ ...validApplication, level: 'SHS', gradeLevel: 'Grade 11', strand: '11-ACADEMIC', periodId: '1', privacyConsent: true, [field.key]: '   ' }).expect(422);
    expect(result.body.errors[field.key]).toBeTruthy(); expect(store.save).not.toHaveBeenCalled();
  });
  it('rejects wrong JSON field types and recalculates a forged age before saving', async () => {
    const result = await post({ ...validApplication, periodId: '1', privacyConsent: true, parentEmail: ['hidden@example.com'], birthday: 20130115, guardianContact: { phone: '09171234567' } }).expect(422);
    expect(Object.keys(result.body.errors)).toEqual(expect.arrayContaining(['parentEmail', 'birthday', 'guardianContact']));
    await post({ ...validApplication, periodId: '1', privacyConsent: true, age: '999' }).expect(201);
    expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ age: expect.not.stringMatching(/^999$/) }) }));
  });
  it('enforces file size and permits a real PDF signature', async () => {
    await post().attach('attachment', Buffer.alloc(maxAttachmentBytes + 1), { filename: 'large.pdf', contentType: 'application/pdf' }).expect(422);
    await post().attach('attachment', Buffer.from('%PDF-1.4\nexample'), { filename: 'document.pdf', contentType: 'application/pdf' }).expect(201);
    expect(store.upload).toHaveBeenCalledOnce();
  });
  it('rejects missing, failed and expired CAPTCHA without saving', async () => {
    await post(undefined, '').expect(422);
    verify.mockResolvedValue(false); await post().expect(422);
    expect(store.save).not.toHaveBeenCalled();
  });
  it('fails safely on provider or persistence outage', async () => {
    verify.mockRejectedValue(new Error('secret provider response'));
    expect((await post().expect(503)).text).not.toContain('secret');
    verify.mockResolvedValue(true); vi.mocked(store.save).mockRejectedValue(new Error('database secret'));
    expect((await post().expect(503)).body.reference).toBeUndefined();
  });
  it('maps atomic database rate limits and close races, removing rejected attachments', async () => {
    vi.mocked(store.save).mockRejectedValue(new SubmissionError('rate_limit'));
    const result = await post().attach('attachment', Buffer.from('%PDF-1.4'), { filename: 'document.pdf', contentType: 'application/pdf' }).expect(429);
    expect(result.headers['retry-after']).toBe('3600'); expect(store.remove).toHaveBeenCalledOnce();
    vi.mocked(store.save).mockRejectedValue(new SubmissionError('closed')); await post().expect(403);
  });
  it('returns the same receipt after a retry and removes the redundant upload', async () => {
    vi.mocked(store.save).mockResolvedValue({ reference: 'SNCS-EXISTING', created: false });
    const response = await post().attach('attachment', Buffer.from('%PDF-1.4'), { filename: 'document.pdf', contentType: 'application/pdf' }).expect(200);
    expect(response.body.reference).toBe('SNCS-EXISTING'); expect(store.remove).toHaveBeenCalledOnce();
  });
  it('does not trust spoofed forwarding headers or a foreign origin', async () => {
    await post().set('X-Forwarded-For', '203.0.113.99').expect(201);
    expect(verify.mock.calls[0][1]).not.toBe('203.0.113.99');
    await post().set('Origin', 'https://other.example').expect(403);
  });
  it('requires explicit privacy consent and rejects stale period IDs before saving', async () => {
    const result = await post({ ...validApplication, periodId: '1', privacyConsent: false }).expect(422);
    expect(result.body.errors.privacyConsent).toBeTruthy();
    await post({ ...validApplication, periodId: '2', privacyConsent: true }).expect(403);
    expect(store.save).not.toHaveBeenCalled();
  });
});
