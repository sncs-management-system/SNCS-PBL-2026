// Keep provider diagnostics useful without retaining response messages, SQL,
// applicant details, request headers, or credentials.
const connectionCodes = new Set(['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH',
  'ENETUNREACH', 'ERR_INVALID_URL', 'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'CONNECTION_TIMEOUT']);
export class ServiceError extends Error {
  readonly providerCode: string | undefined;
  constructor(message: string, code?: unknown, public readonly component?: 'database_connection' | 'database_transaction') {
    super(message);
    this.providerCode = typeof code === 'string' && (/^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(code) || connectionCodes.has(code)) ? code : undefined;
  }
}
