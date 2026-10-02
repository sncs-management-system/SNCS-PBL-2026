import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, relative, sep } from 'node:path';
import ts from 'typescript';

// Use native Node to catch failures hidden by Vite/Vitest/tsx import resolution.
const root = fileURLToPath(new URL('../', import.meta.url));
const cache = resolve(root, 'node_modules/.cache');
mkdirSync(cache, { recursive: true });
const output = mkdtempSync(resolve(cache, 'pb12-runtime-'));
let server;
const originalFetch = globalThis.fetch;
try {
  // Match Vercel's language-service host, which does not canonicalize pnpm
  // symlinks with realpath. A normal tsc run alone misses this resolution failure.
  const configPath = resolve(root, 'api/tsconfig.json');
  const tsConfig = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(tsConfig.config, ts.sys, resolve(root, 'api'), undefined, configPath);
  const service = ts.createLanguageService({
    getScriptFileNames: () => parsed.fileNames,
    getScriptVersion: () => '1',
    getScriptSnapshot: path => {
      const contents = ts.sys.readFile(path);
      return contents === undefined ? undefined : ts.ScriptSnapshot.fromString(contents);
    },
    getCurrentDirectory: () => root,
    getCompilationSettings: () => parsed.options,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    readFile: ts.sys.readFile, fileExists: ts.sys.fileExists, readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists, getDirectories: ts.sys.getDirectories,
  });
  const diagnostics = [...parsed.errors, ...parsed.fileNames.flatMap(file => [
    ...service.getSemanticDiagnostics(file), ...service.getSyntacticDiagnostics(file),
  ])];
  service.dispose();
  assert.equal(diagnostics.length, 0, ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: path => path, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
  console.info('Vercel-compatible enrollment type resolution passed.');
  const compiled = spawnSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'),
    '--project', 'api/tsconfig.json', '--noEmit', 'false', '--outDir', output], { cwd: root, encoding: 'utf8' });
  if (compiled.status !== 0) throw new Error(compiled.stdout || compiled.stderr || 'Server compilation failed');
  writeFileSync(resolve(output, 'package.json'), JSON.stringify({ type: 'module' }));
  // Clear host credentials before invoking the real, compiled entry points.
  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'TURNSTILE_SECRET_KEY',
    'TURNSTILE_SITE_KEY', 'TURNSTILE_HOSTNAME', 'APP_ORIGIN', 'IP_HASH_SECRET']) delete process.env[key];
  const config = await import(pathToFileURL(resolve(output, 'api/enrollment/config.js')).href);
  const applications = await import(pathToFileURL(resolve(output, 'api/enrollment/applications.js')).href);
  assert.equal(typeof config.default, 'function');
  assert.equal(typeof applications.default, 'function');
  server = createServer(config.default);
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.address().port}/api/enrollment/config`;
  const unavailable = await originalFetch(url);
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  assert.equal((await unavailable.json()).message.includes('TURNSTILE_SECRET_KEY'), false);

  Object.assign(process.env, { SUPABASE_URL: 'https://runtime-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key',
    TURNSTILE_SECRET_KEY: 'synthetic-test-secret', TURNSTILE_SITE_KEY: 'public-test-key',
    TURNSTILE_HOSTNAME: 'school.example', APP_ORIGIN: 'https://school.example', IP_HASH_SECRET: 'x'.repeat(32) });
  let reads = 0;
  globalThis.fetch = async input => {
    const requestUrl = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    assert.equal(requestUrl.origin, 'https://runtime-test.supabase.co');
    assert.equal(requestUrl.pathname, '/rest/v1/enrollment_periods');
    reads++;
    return Response.json([{ id: '1', status: 'open', school_year: '2026-2027' }]);
  };
  const available = await originalFetch(url);
  assert.equal(available.status, 200);
  assert.deepEqual(await available.json(), { status: 'open', schoolYear: '2026-2027', periodId: '1', siteKey: 'public-test-key' });
  assert.equal(reads, 1);
  console.info('Compiled enrollment entry points and HTTP configuration check passed in native Node.');
} finally {
  globalThis.fetch = originalFetch;
  if (server) await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
  // Delete only the unique test output directory verified inside the project cache.
  const location = relative(cache, output);
  if (!location.startsWith(`..${sep}`) && !location.includes(sep) && location.startsWith('pb12-runtime-')) {
    rmSync(output, { recursive: true, force: true });
  }
}
