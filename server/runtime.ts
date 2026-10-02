import type { Request } from 'express';
import ipaddr from 'ipaddr.js';
import { createApp } from './app';
import { supabaseStore } from './supabase';
import { verifyTurnstile } from './turnstile';

export class ConfigurationError extends Error {}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) throw new ConfigurationError(`Missing required setting: ${name}`);
  return value;
}

// Vercel overwrites this header at its edge. Only the Vercel adapter uses it;
// the ordinary server still requires explicitly configured trusted proxies.
export function vercelClientIp(req: Request): string {
  const ip = req.get('x-vercel-forwarded-for');
  if (!ip || !ipaddr.isValid(ip)) throw new Error('Vercel client address unavailable');
  return ip;
}

export function configuredApp(env = process.env, platform: 'server' | 'vercel' = 'server') {
  const secret = required(env, 'TURNSTILE_SECRET_KEY');
  const hostname = required(env, 'TURNSTILE_HOSTNAME');
  const ipHashSecret = required(env, 'IP_HASH_SECRET');
  if (ipHashSecret.length < 32) throw new ConfigurationError('IP_HASH_SECRET must have at least 32 characters');
  const allowedOrigin = required(env, 'APP_ORIGIN');
  let origin: URL;
  try { origin = new URL(allowedOrigin); }
  catch { throw new ConfigurationError('APP_ORIGIN must be a complete website origin'); }
  if (!['https:', 'http:'].includes(origin.protocol) || origin.origin !== allowedOrigin || origin.hostname !== hostname) {
    throw new ConfigurationError('APP_ORIGIN must contain only the scheme and TURNSTILE_HOSTNAME, with an optional port');
  }
  return createApp(supabaseStore(required(env, 'SUPABASE_URL'), env.SUPABASE_SECRET_KEY || required(env, 'SUPABASE_SERVICE_ROLE_KEY')),
    (token, ip) => verifyTurnstile(secret, hostname, token, ip), {
      siteKey: required(env, 'TURNSTILE_SITE_KEY'), ipHashSecret, allowedOrigin,
      trustProxy: platform === 'server' ? env.TRUSTED_PROXIES?.split(',').map(value => value.trim()).filter(Boolean) : undefined,
      clientIp: platform === 'vercel' ? vercelClientIp : undefined,
    });
}
