// @vitest-environment jsdom
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import EnrollmentCaptcha from './EnrollmentCaptcha.vue';

let wrapper: VueWrapper | undefined;
let options: Record<string, unknown>;
const render = vi.fn((_element: HTMLElement, config: Record<string, unknown>) => { options = config; return 'widget'; });
const remove = vi.fn();
function installApi(ready = (callback: () => void) => callback()) {
  window.turnstile = { ready, render, remove, reset: vi.fn() };
}
function mountCaptcha() { wrapper = mount(EnrollmentCaptcha, { attachTo: document.body, props: { siteKey: 'test-site-key' } }); return wrapper; }
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); delete window.turnstile; });
afterEach(() => { wrapper?.unmount(); wrapper = undefined; document.querySelector('#enrollment-turnstile')?.remove(); delete window.turnstile; vi.useRealTimers(); });

it('shows loading feedback and lets a stalled script request be replaced on retry', async () => {
  const view = mountCaptcha();
  const originalScript = document.querySelector('#enrollment-turnstile');
  expect(view.text()).toContain('Loading security check');
  await vi.advanceTimersByTimeAsync(20_000);
  expect(view.get('[role="alert"]').text()).toContain('could not load');
  await view.get('button').trigger('click');
  expect(document.querySelector('#enrollment-turnstile')).not.toBe(originalScript);
  expect(view.text()).toContain('Loading security check');
  installApi();
  document.querySelector('#enrollment-turnstile')!.dispatchEvent(new Event('load'));
  expect(render).toHaveBeenCalledTimes(1);
});
it('reports a blocked script without leaving an empty security check area', async () => {
  const view = mountCaptcha();
  document.querySelector('#enrollment-turnstile')!.dispatchEvent(new Event('error'));
  await view.vm.$nextTick();
  expect(view.get('[role="alert"]').text()).toContain('could not load');
  expect(document.querySelector('#enrollment-turnstile')).toBeNull();
  expect(view.emitted('token')?.at(-1)).toEqual(['']);
});
it('waits for the API to be ready and reports success without exposing the token', async () => {
  let readyCallback: () => void = () => {};
  installApi(callback => { readyCallback = callback; });
  const view = mountCaptcha();
  expect(render).not.toHaveBeenCalled();
  readyCallback();
  expect(options.appearance).toBe('always');
  (options.callback as (token: string) => void)('private-test-token');
  await view.vm.$nextTick();
  expect(view.text()).toContain('Security check complete');
  expect(view.text()).not.toContain('private-test-token');
  expect(view.emitted('token')?.at(-1)).toEqual(['private-test-token']);
  await vi.advanceTimersByTimeAsync(60_000);
  expect(view.find('[role="alert"]').exists()).toBe(false);
});
it('explains a hostname rejection and ignores callbacks from a removed widget after retry', async () => {
  installApi(); const view = mountCaptcha();
  const previousOptions = options;
  (options['error-callback'] as (code: string) => void)('110200');
  await view.vm.$nextTick();
  expect(view.text()).toContain('not configured for this website');
  await view.get('button').trigger('click');
  expect(remove).toHaveBeenCalledWith('widget');
  expect(render).toHaveBeenCalledTimes(2);
  (previousOptions.callback as (token: string) => void)('stale-token');
  expect(view.emitted('token')?.at(-1)).toEqual(['']);
});
it('makes stalled challenges retryable but does not time out someone interacting with the widget', async () => {
  installApi(); const view = mountCaptcha();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(view.find('[role="alert"]').exists()).toBe(true);
  await view.get('button').trigger('click');
  (options['before-interactive-callback'] as () => void)();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(view.find('[role="alert"]').exists()).toBe(false);
});
it('clears an expired token and handles a render failure with a retry message', async () => {
  installApi(); const view = mountCaptcha();
  (options.callback as (token: string) => void)('test-token');
  (options['expired-callback'] as () => void)();
  await view.vm.$nextTick();
  expect(view.emitted('token')?.at(-1)).toEqual(['']);
  render.mockImplementationOnce(() => { throw new Error('provider failed'); });
  await view.get('button').trigger('click');
  expect(view.get('[role="alert"]').text()).toContain('could not load');
});
it('removes pending listeners so reopening review does not render an abandoned widget', () => {
  mountCaptcha(); const script = document.querySelector('#enrollment-turnstile')!;
  wrapper!.unmount(); wrapper = undefined;
  installApi(); mountCaptcha();
  script.dispatchEvent(new Event('load'));
  expect(render).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(1);
});
