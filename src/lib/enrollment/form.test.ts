import { describe, expect, it } from 'vitest';
import { ageAt, attachmentError, maxAttachmentBytes, sectionsFor, validateApplication } from './form';
import { validApplication } from './fixtures';

describe('registration form validation', () => {
  it('accepts JHS, trims names, calculates age, strips unknown/staff fields and SHS strand', () => {
    const { data, errors } = validateApplication({ ...validApplication, surname: ' Example ', status: 'Complete', strand: '12-STEM', age: '90' }, '2026-2027', '2026-10-01');
    expect(errors).toEqual({});
    expect(data.surname).toBe('Example'); expect(data.age).toBe('13'); expect(data.strand).toBe(''); expect(data.status).toBeUndefined();
  });
  it.each([['Grade 11', '11-ACADEMIC'], ['Grade 11', '11-TECHPRO'], ['Grade 12', '12-STEM'], ['Grade 12', '12-HUMSS'], ['Grade 12', '12-GAS'], ['Grade 12', '12-ABM'], ['Grade 12', '12-ICT']])('accepts SHS %s / %s', (gradeLevel, strand) => {
    expect(validateApplication({ ...validApplication, level: 'SHS', gradeLevel, strand }, '2026-2027').errors).toEqual({});
  });
  it('rejects incorrect level, grade, strand and year combinations', () => {
    expect(validateApplication({ ...validApplication, level: 'SHS', gradeLevel: 'Grade 11', strand: '12-STEM' }, '2027-2028').errors).toHaveProperty('strand');
    expect(validateApplication({ ...validApplication, gradeLevel: 'Grade 12' }, '2027-2028').errors).toHaveProperty('gradeLevel');
    expect(validateApplication(validApplication, '2027-2028').errors).toHaveProperty('schoolYear');
    expect(validateApplication({ ...validApplication, level: 'other' }, '2026-2027').errors).toHaveProperty('level');
  });
  it('names required fields and validates optional contact details when supplied', () => {
    const errors = validateApplication({ ...validApplication, firstName: '', email: 'bad', parentEmail: 'bad', fatherContact: 'abc', contact: '1234' }, '2026-2027').errors;
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['firstName', 'email', 'parentEmail', 'fatherContact', 'contact']));
  });
  it('keeps sibling counts produced by numeric form inputs', () => {
    expect(validateApplication({ ...validApplication, siblings: 0 }, '2026-2027').data.siblings).toBe('0');
    expect(validateApplication({ ...validApplication, siblings: -1 }, '2026-2027').errors).toHaveProperty('siblings');
  });
  it('handles birthdays, leap dates and future dates', () => {
    expect(ageAt('2010-10-02', '2026-10-01')).toBe('15');
    expect(ageAt('2010-10-01', '2026-10-01')).toBe('16');
    expect(ageAt('2013-02-29')).toBe('');
    expect(ageAt('2027-01-01', '2026-10-01')).toBe('');
  });
  it('includes every source column (guardian siblings and SHS strand included)', () => {
    expect(sectionsFor({ level: 'JHS' }).flatMap(s => s.fields)).toHaveLength(44);
    expect(sectionsFor({ level: 'SHS' }).flatMap(s => s.fields)).toHaveLength(45);
  });
  it('limits file size, extension and MIME type', () => {
    expect(attachmentError({ size: maxAttachmentBytes, type: 'application/pdf', name: 'file.pdf' })).toBe('');
    expect(attachmentError({ size: maxAttachmentBytes + 1, type: 'application/pdf', name: 'file.pdf' })).toContain('5 MB');
    expect(attachmentError({ size: 1, type: 'image/png', name: 'file.exe' })).toContain('PDF');
    expect(attachmentError({ size: 0, type: 'application/pdf', name: 'file.pdf' })).toContain('empty');
  });
});
