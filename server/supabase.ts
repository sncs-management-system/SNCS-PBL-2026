import { createClient } from '@supabase/supabase-js';
import { SubmissionError, type EnrollmentStore } from './app';
import { mapEnrollment } from './enrollment-mapping';

export function supabaseStore(url: string, serviceKey: string): EnrollmentStore {
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async period() {
      const { data, error } = await db.from('enrollment_periods').select('id::text,status,school_year').eq('status', 'open').maybeSingle();
      if (error) throw new Error('Enrollment configuration unavailable');
      if (!data) return { status: 'closed', schoolYear: '', periodId: null };
      return { status: data.status, schoolYear: data.school_year, periodId: String(data.id) };
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
      const mapped = mapEnrollment(input.data, input.periodId);
      const { data, error } = await db.rpc('submit_pb12_enrollment', {
        p_submission_id: input.submissionId, p_ip_hash: input.ipHash,
        p_application: mapped.application, p_guardians: mapped.guardians, p_school_year: input.data.schoolYear,
        p_privacy_consent: true,
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
