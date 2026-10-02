import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import type { EnrollmentStore } from './app.js';
import { ServiceError } from './service-error.js';
import { saveEnrollment } from './enrollment-transaction.js';

export function supabaseStore(url: string, serviceKey: string, databaseUrl?: string, sslCa?: string): EnrollmentStore {
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let pool: Pool | undefined;
  async function connectDatabase() {
    if (!databaseUrl) throw new ServiceError('Missing server database connection', 'DBURL', 'database_connection');
    try {
      if (!pool) {
        const connection = new URL(databaseUrl);
        if (!['postgres:', 'postgresql:'].includes(connection.protocol)) throw new ServiceError('Invalid database connection format', 'DBFMT', 'database_connection');
        // URL SSL options must not replace certificate verification settings.
        for (const key of [...connection.searchParams.keys()]) if (key.startsWith('ssl')) connection.searchParams.delete(key);
        pool = new Pool({ connectionString: connection.toString(), ssl: { rejectUnauthorized: true, ...(sslCa ? { ca: sslCa } : {}) },
          max: 2, connectionTimeoutMillis: 10_000, query_timeout: 10_000, idleTimeoutMillis: 10_000, allowExitOnIdle: true });
        pool.on('error', () => console.error('Enrollment database idle connection failed'));
      }
      return await pool.connect();
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      const code = error && typeof error === 'object' && 'code' in error ? error.code
        : error instanceof Error && error.message === 'Connection terminated due to connection timeout' ? 'CONNECTION_TIMEOUT' : undefined;
      throw new ServiceError('Database connection unavailable', code, 'database_connection');
    }
  }
  return {
    async period() {
      // A configured database must be reachable before offering the form.
      // This read-only probe diagnoses connection failures without test submissions.
      if (databaseUrl) {
        const client = await connectDatabase();
        let failed = false;
        try { await client.query('select 1'); }
        catch (error) { failed = true; throw new ServiceError('Database connection unavailable', error && typeof error === 'object' && 'code' in error ? error.code : undefined, 'database_connection'); }
        finally { client.release(failed); }
      }
      const { data, error } = await db.from('enrollment_periods').select('id::text,status,school_year').eq('status', 'open').maybeSingle();
      if (error) throw new ServiceError('Enrollment configuration unavailable', error.code);
      if (!data) return { status: 'closed', schoolYear: '', periodId: null };
      return { status: data.status, schoolYear: data.school_year, periodId: String(data.id) };
    },
    async save(input) {
      const client = await connectDatabase();
      let failed = false;
      try { return await saveEnrollment(client, input); }
      catch (error) { failed = true; throw error; }
      finally { client.release(failed); }
    },
  };
}
