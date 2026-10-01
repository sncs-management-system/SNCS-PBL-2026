import { createClient } from '@supabase/supabase-js';
import { SubmissionError, type EnrollmentStore } from './app';

export function supabaseStore(url: string, serviceKey: string): EnrollmentStore {
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async period() {
      const { data, error } = await db.from('enrollment_settings').select('status,school_year').eq('id', 1).single();
      if (error || !data) throw new Error('Enrollment configuration unavailable');
      return { status: data.status, schoolYear: data.school_year };
    },
    async upload(path, buffer, type) {
      const { error } = await db.storage.from('enrollment-documents').upload(path, buffer, { contentType: type, upsert: false });
      if (error) throw new Error('Document upload failed');
    },
    async remove(path) {
      const { error } = await db.storage.from('enrollment-documents').remove([path]);
      if (error) throw new Error('Document cleanup failed');
    },
    async save(input) {
      const { data, error } = await db.rpc('submit_enrollment_application', {
        p_submission_id: input.submissionId, p_ip_hash: input.ipHash, p_data: input.data,
        p_attachment: input.attachment, p_attachment_path: input.attachmentPath,
      });
      if (error) {
        if (error.message === 'ENROLLMENT_CLOSED') throw new SubmissionError('closed');
        if (error.message === 'RATE_LIMIT') throw new SubmissionError('rate_limit');
        if (error.message === 'SUBMISSION_CONFLICT') throw new SubmissionError('conflict');
        throw new Error('Application save failed');
      }
      if (!data?.reference) throw new Error('Application receipt unavailable');
      return data;
    },
  };
}
