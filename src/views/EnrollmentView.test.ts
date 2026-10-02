// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EnrollmentView from './EnrollmentView.vue';
import { validApplication } from '@/lib/enrollment/fixtures';

describe('enrollment applicant workflow', () => {
  let wrapper: VueWrapper;
  const fetchMock = vi.fn();
  const captcha = { template: '<button type="button" @click="$emit(\'token\', \'test-token\')">Complete security check</button>', emits: ['token'], methods: { reset() {} } };
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ status: 'open', schoolYear: '2026-2027', periodId: '1', siteKey: 'test-key' }) });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => { wrapper?.unmount(); vi.unstubAllGlobals(); });
  async function render() {
    wrapper = mount(EnrollmentView, { attachTo: document.body, global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, EnrollmentCaptcha: captcha } } });
    await flushPromises();
  }
  async function fill() {
    for (const [key, value] of Object.entries(validApplication)) {
      if (key !== 'schoolYear') await wrapper.get(`#${key}`).setValue(value);
    }
  }
  it('shows closed enrollment without rendering a submit form', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'closed', schoolYear: '', periodId: null, siteKey: 'test' }) });
    await render(); expect(wrapper.text()).toContain('Enrollment is currently closed'); expect(wrapper.find('form').exists()).toBe(false);
  });
  it('fails closed when configuration is unavailable and lets the user retry', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await render(); expect(wrapper.find('form').exists()).toBe(false);
    await wrapper.get('button').trigger('click'); await flushPromises(); expect(wrapper.find('form').exists()).toBe(true);
  });
  it('clears incompatible grade/strand values when changing school level', async () => {
    await render(); await wrapper.get('#level').setValue('SHS'); await wrapper.get('#gradeLevel').setValue('Grade 12'); await wrapper.get('#strand').setValue('12-STEM');
    await wrapper.get('#gradeLevel').setValue('Grade 11');
    expect((wrapper.get('#strand').element as HTMLSelectElement).value).toBe('');
    expect(wrapper.get('#strand').text()).toContain('11-TECHPRO');
    await wrapper.get('#level').setValue('JHS'); expect(wrapper.find('#strand').exists()).toBe(false);
  });
  it('offers all four school levels and resets grade and strand when switching to the new levels', async () => {
    await render();
    expect(wrapper.get('#level').findAll('option').slice(1).map(option => option.text()))
      .toEqual(['Pre-school', 'Elementary', 'Junior High School', 'Senior High School']);
    await wrapper.get('#level').setValue('SHS'); await wrapper.get('#gradeLevel').setValue('Grade 12'); await wrapper.get('#strand').setValue('12-STEM');
    await wrapper.get('#level').setValue('Preschool');
    expect(wrapper.find('#strand').exists()).toBe(false);
    expect((wrapper.get('#gradeLevel').element as HTMLSelectElement).value).toBe('');
    expect(wrapper.get('#gradeLevel').findAll('option').slice(1).map(option => option.text())).toEqual(['Nursery', 'Kindergarten']);
    await wrapper.get('#gradeLevel').setValue('Nursery');
    await wrapper.get('#level').setValue('Elementary');
    expect((wrapper.get('#gradeLevel').element as HTMLSelectElement).value).toBe('');
    expect(wrapper.get('#gradeLevel').findAll('option').slice(1).map(option => option.text()))
      .toEqual(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
  });
  it('shows field errors before review and preserves data when editing', async () => {
    await render(); await wrapper.get('form').trigger('submit'); await flushPromises();
    expect(wrapper.get('#firstName').attributes('aria-invalid')).toBe('true');
    await fill(); await wrapper.get('form').trigger('submit'); await flushPromises();
    expect(wrapper.text()).toContain('Review your application');
    await wrapper.get('.button-edit').trigger('click');
    expect((wrapper.get('#firstName').element as HTMLInputElement).value).toBe('Test');
  });
  it('submits only after review, confirmation and CAPTCHA, then shows saved receipt', async () => {
    await render(); await fill(); await wrapper.get('form').trigger('submit'); await flushPromises();
    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined();
    await wrapper.get('#confirmation').setValue(true);
    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined();
    await wrapper.get('#privacyConsent').setValue(true);
    await wrapper.get('#captcha button').trigger('click');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reference: 'SNCS-TEST-RECEIPT', status: 'Pending', message: 'Proceed to the Registrar’s Office.' }) });
    await wrapper.get('form').trigger('submit'); await flushPromises();
    expect(wrapper.text()).toContain('SNCS-TEST-RECEIPT'); expect(wrapper.text()).toContain('Pending'); expect(wrapper.find('form').exists()).toBe(false);
    const payload = JSON.parse(fetchMock.mock.calls[1][1].body.get('application'));
    expect(payload.privacyConsent).toBe(true); expect(payload.periodId).toBe('1');
  });
  it('keeps the same submission identifier after an uncertain network failure', async () => {
    await render(); await fill(); await wrapper.get('form').trigger('submit'); await flushPromises();
    await wrapper.get('#confirmation').setValue(true); await wrapper.get('#privacyConsent').setValue(true); await wrapper.get('#captcha button').trigger('click');
    fetchMock.mockRejectedValueOnce(new Error('network failure'));
    await wrapper.get('form').trigger('submit'); await flushPromises();
    expect(wrapper.text()).toContain('could not confirm'); expect(wrapper.find('.receipt-reference').exists()).toBe(false);
    const firstId = fetchMock.mock.calls[1][1].body.get('submissionId');
    await wrapper.get('#captcha button').trigger('click');
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ reference: 'SNCS-RETRY', status: 'Pending' }) });
    await wrapper.get('form').trigger('submit'); await flushPromises();
    expect(fetchMock.mock.calls[2][1].body.get('submissionId')).toBe(firstId);
  });
});
