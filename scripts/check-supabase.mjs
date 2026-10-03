import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'

// Read-only setup check. Does not list records, upload files, or modify policies.
const localPath = resolve('.env.local')
let localEnv = {}
try {
  localEnv = parseEnv(readFileSync(localPath, 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || localEnv.VITE_SUPABASE_URL
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || localEnv.VITE_SUPABASE_PUBLISHABLE_KEY

try {
  if (!supabaseUrl || !publishableKey) {
    throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.')
  }
  const url = new URL(supabaseUrl)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.hostname.endsWith('.supabase.co') || url.pathname !== '/') {
    throw new Error('VITE_SUPABASE_URL must be the HTTPS project URL from the Supabase dashboard.')
  }
  if (!publishableKey.startsWith('sb_publishable_')) {
    throw new Error('Use the Supabase publishable key. Secret and service-role keys must stay on the server.')
  }

  for (const [name, path] of [
    ['Supabase API/key', '/auth/v1/settings'],
    ['Resources table endpoint (zero rows requested)', '/rest/v1/resources?select=id&limit=0'],
  ]) {
    const response = await fetch(new URL(path, url), {
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}. Check the project URL, key, and Data API configuration.`)
    await response.arrayBuffer()
    console.log(`PASS: ${name}`)
  }
  console.log('Connectivity verified. This does not verify RLS policies or PDF downloads; finish those in PB-11.')
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Supabase setup check failed.')
  process.exitCode = 1
}
