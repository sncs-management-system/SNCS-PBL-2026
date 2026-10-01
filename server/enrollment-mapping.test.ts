import { expect, it } from 'vitest';
import { mapEnrollment } from './enrollment-mapping';
import { validApplication } from '../src/lib/enrollment/fixtures';

it.each([['Full Payment/Cash', 'full_cash'], ['Monthly', 'monthly'], ['Quarterly', 'quarterly'], ['Semi-Annual', 'semi_annual']])('maps %s to the schema enum %s', (paymentMode, expected) => {
  const result = mapEnrollment({ ...validApplication, paymentMode, studentStatus: 'Returnee', age: '13', status: 'complete', privacy_consent_at: '2000-01-01' }, '9007199254740993');
  expect(result.application).toMatchObject({ period_id: '9007199254740993', applicant_type: 'returnee', mode_of_payment: expected, strand: null });
  for (const key of ['age', 'school_year', 'status', 'privacy_consent_at', 'reference_no', 'registrar_remarks']) expect(result.application).not.toHaveProperty(key);
  expect(result.guardians).toEqual([{ relationship: 'guardian', full_name: 'Guardian Example', occupation: null, contact_number: '+63 917 123 4567' }]);
});
