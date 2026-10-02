import express, { type ErrorRequestHandler, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { createHmac } from 'node:crypto';
import ipaddr from 'ipaddr.js';
import { ServiceError } from './service-error.js';
import { validateApplication, type Application } from '../src/lib/enrollment/form.js';

export type Period = { status: 'open' | 'closed'; schoolYear: string; periodId: string | null };
export type Receipt = { reference: string; created: boolean };
export type SaveInput = { submissionId: string; periodId: string; ipHash: string; data: Application };
export interface EnrollmentStore {
  period(): Promise<Period>;
  save(input: SaveInput): Promise<Receipt>;
}
export class SubmissionError extends Error {
  constructor(public code: 'closed' | 'rate_limit' | 'conflict') { super(code); }
}
export type AppConfig = { siteKey: string; ipHashSecret: string; allowedOrigin: string; trustProxy?: string[]; clientIp?: (req: Request) => string };
export function createApp(store: EnrollmentStore, verifyCaptcha: (token: string, ip: string) => Promise<boolean>, config: AppConfig) {
  const app = express();
  app.disable('x-powered-by');
  // Only named, trusted proxy addresses may supply a forwarded client address.
  app.set('trust proxy', config.trustProxy ?? false);
  app.use('/api', (_req: Request, res: Response, next: NextFunction) => { res.set('Cache-Control', 'no-store'); next(); });
  const parseForm = multer({ limits: { files: 0, fields: 3, fieldSize: 32 * 1024, parts: 3 } }).none();
  app.get('/api/enrollment/config', async (_req: Request, res: Response) => {
    res.locals.enrollmentStage = 'period';
    const period = await store.period();
    res.json({ ...period, siteKey: config.siteKey });
  });
  app.post('/api/enrollment/applications', (req: Request, res: Response, next: NextFunction) => {
    if (req.get('origin') && req.get('origin') !== config.allowedOrigin) {
      res.status(403).json({ message: 'Submission is not allowed from this site.' }); return;
    }
    next();
  }, parseForm, async (req: Request, res: Response) => {
    res.locals.enrollmentStage = 'period';
    const period = await store.period();
    if (period.status !== 'open' || !period.periodId) { res.status(403).json({ message: 'Enrollment is currently closed.' }); return; }
    let input: unknown;
    try { input = JSON.parse(req.body?.application ?? 'null'); }
    catch { res.status(400).json({ message: 'The application could not be read. Please try again.' }); return; }
    const { data, errors } = validateApplication(input, period.schoolYear);
    const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
    if (raw.periodId !== period.periodId) {
      res.status(403).json({ message: 'The enrollment period has changed. Reload the page before submitting.' }); return;
    }
    if (raw.privacyConsent !== true) errors.privacyConsent = 'Consent to the collection and use of these details for enrollment is required.';
    if (Object.keys(errors).length) { res.status(422).json({ message: 'Please correct the highlighted fields.', errors }); return; }
    const submissionId = req.body?.submissionId;
    if (typeof submissionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
      res.status(400).json({ message: 'Invalid submission identifier. Reload the page.' }); return;
    }
    const token = req.body?.captchaToken;
    res.locals.enrollmentStage = 'client_ip';
    const ip = ipaddr.process(config.clientIp ? config.clientIp(req) : req.ip ?? req.socket.remoteAddress ?? '127.0.0.1').toNormalizedString();
    res.locals.enrollmentStage = 'captcha';
    if (typeof token !== 'string' || !token || token.length > 2048 || !await verifyCaptcha(token, ip)) {
      res.status(422).json({ message: 'Please complete the security check again.', errors: { captcha: 'Security check failed or expired.' } }); return;
    }
    let receipt: Receipt;
    try {
      res.locals.enrollmentStage = 'save';
      receipt = await store.save({ submissionId, periodId: period.periodId, ipHash: createHmac('sha256', config.ipHashSecret).update(ip).digest('hex'), data });
    } catch (error) {
      if (error instanceof SubmissionError) {
        if (error.code === 'rate_limit') res.set('Retry-After', '3600').status(429).json({ message: 'Five applications have already been submitted from this connection in the past hour. Please try again later.' });
        else if (error.code === 'closed') res.status(403).json({ message: 'Enrollment has closed or the school year has changed. Reload the page.' });
        else res.status(409).json({ message: 'This submission was already received with different details. Reload to start a new application.' });
        return;
      }
      throw error;
    }
    res.status(receipt.created ? 201 : 200).json({ reference: receipt.reference, status: 'Pending', message: 'Please proceed to the Registrar’s Office with your reference number for verification and the next enrollment steps.' });
  });
  // Express identifies error middleware by its four-argument signature.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleError: ErrorRequestHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof multer.MulterError) {
      res.status(422).json({ message: 'Please submit the application without file attachments.', errors: { attachment: 'Document uploads are unavailable. Provide requirements to the Registrar.' } }); return;
    }
    // Never include application data, credentials, provider responses, or SQL in public errors.
    console.error('Enrollment service failure', {
      stage: res.locals.enrollmentStage ?? 'request',
      ...(error instanceof ServiceError && error.component ? { component: error.component } : {}),
      ...(error instanceof ServiceError && error.providerCode ? { providerCode: error.providerCode } : {}),
    });
    res.status(503).json({ message: 'Enrollment service is temporarily unavailable. Keep this page open and try again.' });
  };
  app.use(handleError);
  return app;
}
