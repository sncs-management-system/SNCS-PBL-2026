import { resolve } from 'node:path';
import express from 'express';
import { createApp } from './app';
import { supabaseStore } from './supabase';
import { verifyTurnstile } from './turnstile';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required setting: ${name}`);
  return value;
}
const secret = required('TURNSTILE_SECRET_KEY');
const hostname = required('TURNSTILE_HOSTNAME');
const ipHashSecret = required('IP_HASH_SECRET');
if (ipHashSecret.length < 32) throw new Error('IP_HASH_SECRET must have at least 32 characters');
const app = createApp(supabaseStore(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY')),
  (token, ip) => verifyTurnstile(secret, hostname, token, ip), {
    siteKey: required('TURNSTILE_SITE_KEY'), ipHashSecret, allowedOrigin: required('APP_ORIGIN'),
    trustProxy: process.env.TRUSTED_PROXIES?.split(',').map(value => value.trim()).filter(Boolean),
  });
if (process.env.NODE_ENV === 'production') {
  const dist = resolve('dist');
  app.use(express.static(dist));
  app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api/')) { res.status(404).json({ message: 'Not found' }); return; }
    res.sendFile(resolve(dist, 'index.html'));
  });
}
app.listen(Number(process.env.PORT ?? 3001), process.env.HOST ?? '127.0.0.1', () => {
  console.info('Enrollment server ready');
});
