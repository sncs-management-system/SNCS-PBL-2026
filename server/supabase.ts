import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import type { EnrollmentStore } from './app.js';
import { ServiceError } from './service-error.js';
import { saveEnrollment } from './enrollment-transaction.js';

export function supabaseStore(url: string, serviceKey: string, databaseUrl?: string, sslCa?: string): EnrollmentStore {
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let pool: Pool | undefined;
  return {
    async period() {
      const { data, error } = await db.from('enrollment_periods').select('id::text,status,school_year').eq('status', 'open').maybeSingle();
      if (error) throw new ServiceError('Enrollment configuration unavailable', error.code);
      if (!data) return { status: 'closed', schoolYear: '', periodId: null };
      return { status: data.status, schoolYear: data.school_year, periodId: String(data.id) };
    },
    async save(input) {
      if (!databaseUrl) throw new ServiceError('Missing server database connection', 'DBURL');
      if (!pool) {
        const connection = new URL(databaseUrl);
        // URL SSL options must not replace certificate verification settings.
        for (const key of [...connection.searchParams.keys()]) if (key.startsWith('ssl')) connection.searchParams.delete(key);
        pool = new Pool({ connectionString: connection.toString(), ssl: { rejectUnauthorized: true, ...(sslCa ? { ca: sslCa } : {}) },
          max: 2, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 10_000, allowExitOnIdle: true });
        pool.on('error', () => console.error('Enrollment database idle connection failed'));
      }
      const client = await pool.connect().catch(error => { throw new ServiceError('Database connection unavailable', error.code); });
      let failed = false;
      try { return await saveEnrollment(client, input); }
      catch (error) { failed = true; throw error; }
      finally { client.release(failed); }
    },
  };
}
