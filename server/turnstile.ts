export async function verifyTurnstile(secret: string, hostname: string, token: string, ip: string): Promise<boolean> {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }), signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Security check unavailable');
  const result = await response.json();
  return result.success === true && result.hostname === hostname && result.action === 'enrollment';
}
