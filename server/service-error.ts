// Keep provider diagnostics useful without retaining response messages, SQL,
// applicant details, request headers, or credentials.
export class ServiceError extends Error {
  readonly providerCode: string | undefined;
  constructor(message: string, code?: unknown) {
    super(message);
    this.providerCode = typeof code === 'string' && /^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(code) ? code : undefined;
  }
}
