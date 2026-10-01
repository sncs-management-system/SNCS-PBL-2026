export type Field = {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'textarea';
  required?: boolean;
  options?: string[];
  hint?: string;
};
export type Section = { title: string; description: string; fields: Field[] };
export type Application = Record<string, string>;
export type FieldErrors = Record<string, string>;
export const paymentModes = ['Full Payment/Cash', 'Monthly', 'Quarterly', 'Semi-Annual'];
export const strands: Record<string, string[]> = {
  'Grade 11': ['11-ACADEMIC', '11-TECHPRO'],
  'Grade 12': ['12-STEM', '12-HUMSS', '12-GAS', '12-ABM', '12-ICT'],
};
const parentFields = (prefix: string, mother = false): Field[] => [
  { key: `${prefix}FullName`, label: mother ? 'Full maiden name' : 'Full name', hint: 'Required if you provide an occupation or contact number below.' },
  { key: `${prefix}Occupation`, label: 'Occupation' },
  { key: `${prefix}Contact`, label: 'Contact number/s', type: 'tel' },
];
export function sectionsFor(data: Application): Section[] {
  return [
    { title: 'Enrollment details', description: 'Choose the level and grade you are applying for.', fields: [
      { key: 'level', label: 'School level', type: 'select', required: true, options: ['JHS', 'SHS'] },
      { key: 'schoolYear', label: 'School year', required: true, hint: 'Set by the current enrollment period.' },
      { key: 'studentStatus', label: 'Student status', type: 'select', required: true, options: ['New', 'Old', 'Returnee'] },
      { key: 'gradeLevel', label: 'Grade level', type: 'select', required: true, options: data.level === 'SHS' ? ['Grade 11', 'Grade 12'] : ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'] },
      ...(data.level === 'SHS' ? [{ key: 'strand', label: 'Strand', type: 'select' as const, required: true, options: strands[data.gradeLevel] ?? [] }] : []),
      { key: 'paymentMode', label: 'Mode of payment', type: 'select', required: true, options: paymentModes, hint: 'Preference only. No payment is collected online.' },
    ] },
    { title: 'Student information', description: 'Enter the student’s details as they appear in school records.', fields: [
      { key: 'surname', label: 'Surname', required: true },
      { key: 'firstName', label: 'First name', required: true },
      { key: 'middleName', label: 'Middle name' },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'parentEmail', label: 'Parent’s email address', type: 'email' },
      { key: 'messenger', label: 'Parent/guardian’s active Messenger account', required: true },
      { key: 'birthday', label: 'Birthday', type: 'date', required: true },
      { key: 'age', label: 'Age', type: 'number', hint: 'Calculated from the birthday.' },
      { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
      { key: 'address', label: 'Complete address', type: 'textarea', required: true },
      { key: 'birthplace', label: 'Place of birth', required: true },
      { key: 'religion', label: 'Religion', required: true },
      { key: 'contact', label: 'Contact numbers', type: 'tel', required: true, hint: 'For multiple numbers, separate them with commas.' },
    ] },
    { title: 'Father’s information', description: 'Fill in the details that apply to your family.', fields: parentFields('father') },
    { title: 'Mother’s information', description: 'Use the mother’s full maiden name, if applicable.', fields: parentFields('mother', true) },
    { title: 'Guardian’s information', description: 'Provide guardian details if applicable.', fields: parentFields('guardian') },
    { title: 'Last school attended', description: 'Enter the details of the student’s previous school.', fields: [
      { key: 'previousSchool', label: 'Former school’s name' },
      { key: 'previousAddress', label: 'Former school’s complete address', type: 'textarea' },
    ] },
  ];
}
// The school and API use the same date even when hosted in another time zone.
export function todayInManila(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function ageAt(birthday: string, today = todayInManila()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday) || Number.isNaN(Date.parse(birthday)) || new Date(birthday).toISOString().slice(0, 10) !== birthday || birthday > today) return '';
  const age = Number(today.slice(0, 4)) - Number(birthday.slice(0, 4)) - (today.slice(5) < birthday.slice(5) ? 1 : 0);
  return String(age);
}
export function validateApplication(input: unknown, schoolYear: string, today = todayInManila()): { data: Application; errors: FieldErrors } {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const context: Application = { level: typeof raw.level === 'string' ? raw.level : '', gradeLevel: typeof raw.gradeLevel === 'string' ? raw.gradeLevel : '' };
  const data: Application = {};
  const errors: FieldErrors = {};
  for (const field of sectionsFor(context).flatMap(section => section.fields)) {
    const rawValue = raw[field.key];
    const value = typeof rawValue === 'string' ? rawValue.trim() : field.type === 'number' && typeof rawValue === 'number' ? String(rawValue) : '';
    data[field.key] = value;
    if (field.required && !value) errors[field.key] = `${field.label} is required.`;
    else if (value.length > (field.type === 'textarea' ? 1000 : 254)) errors[field.key] = `${field.label} is too long.`;
    else if (value && field.options && !field.options.includes(value)) errors[field.key] = `Choose a valid ${field.label.toLowerCase()}.`;
    else if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.key] = `Enter a valid ${field.label.toLowerCase()}.`;
    else if (value && field.type === 'tel' && !value.split(',').every(phone => /^\+?[\d\s()-]+$/.test(phone.trim()) && phone.replace(/\D/g, '').length >= 7 && phone.replace(/\D/g, '').length <= 15)) errors[field.key] = `${field.label}: enter 7–15 digits per number, separated by commas.`;
  }
  if (data.schoolYear !== schoolYear) errors.schoolYear = 'The school year does not match the current enrollment period. Reload the page.';
  const age = ageAt(data.birthday, today);
  if (age === '' || Number(age) > 120) errors.birthday = 'Enter a valid birthday that is not in the future.';
  data.age = age;
  for (const relationship of ['father', 'mother', 'guardian']) {
    if ((data[`${relationship}Occupation`] || data[`${relationship}Contact`]) && !data[`${relationship}FullName`]) {
      errors[`${relationship}FullName`] = `${relationship[0].toUpperCase()}${relationship.slice(1)}’s full name is required when other details are supplied.`;
    }
  }
  if (data.level === 'JHS') data.strand = '';
  return { data, errors };
}
export const maxAttachmentBytes = 5 * 1024 * 1024;
export function attachmentError(file: { size: number; type: string; name: string }): string {
  if (!file.size) return 'Supporting document is empty.';
  if (file.size > maxAttachmentBytes) return 'Supporting document must be 5 MB or smaller.';
  const extensions: Record<string, RegExp> = { 'application/pdf': /\.pdf$/i, 'image/jpeg': /\.jpe?g$/i, 'image/png': /\.png$/i };
  if (!extensions[file.type]?.test(file.name)) return 'Supporting document must be a PDF, JPG, or PNG file.';
  return '';
}
