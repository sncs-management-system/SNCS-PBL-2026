<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

type Turnstile = {
  ready: (callback: () => void) => void;
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }
const props = defineProps<{ siteKey: string }>();
const emit = defineEmits<{ token: [value: string] }>();
const container = ref<HTMLElement>();
const status = ref<'loading' | 'verifying' | 'verified' | 'failed'>('loading');
const failureMessage = ref('');
let widget: string | undefined;
let mounted = true;
let attempt = 0;
let timeout: ReturnType<typeof setTimeout> | undefined;
let removeListeners: (() => void) | undefined;

function clearTimeoutAndListeners() {
  clearTimeout(timeout);
  removeListeners?.();
  removeListeners = undefined;
}
function fail(code?: string) {
  if (!mounted) return;
  clearTimeoutAndListeners();
  status.value = 'failed';
  failureMessage.value = code === '110200'
    ? 'The security check is not configured for this website. Please contact the school.'
    : 'The security check could not load. Check your connection and try again.';
  emit('token', '');
}

function renderWidget() {
  const currentAttempt = attempt;
  if (!mounted || !window.turnstile) return;
  try {
    window.turnstile.ready(() => {
      if (!mounted || currentAttempt !== attempt || !container.value || widget !== undefined) return;
      clearTimeoutAndListeners();
      status.value = 'verifying';
      // Stop a stalled or invisible challenge from leaving an unexplained blank area.
      timeout = setTimeout(() => fail(), 60_000);
      try {
        widget = window.turnstile!.render(container.value, {
          sitekey: props.siteKey, action: 'enrollment', theme: 'light', size: 'flexible', appearance: 'always',
          callback: (token: string) => {
            if (!mounted || currentAttempt !== attempt) return;
            clearTimeoutAndListeners(); status.value = 'verified'; emit('token', token);
          },
          'before-interactive-callback': () => { if (currentAttempt === attempt) clearTimeout(timeout); },
          'expired-callback': () => { if (mounted && currentAttempt === attempt) fail(); },
          'timeout-callback': () => { if (mounted && currentAttempt === attempt) fail(); },
          'error-callback': (code: string) => { if (currentAttempt === attempt) fail(code); },
        });
      } catch { fail(); }
    });
  } catch { fail(); }
}
function load() {
  clearTimeoutAndListeners();
  attempt++;
  status.value = 'loading';
  failureMessage.value = '';
  emit('token', '');
  timeout = setTimeout(() => fail(), 20_000);
  if (window.turnstile) { renderWidget(); return; }
  let script = document.querySelector<HTMLScriptElement>('#enrollment-turnstile');
  const created = !script;
  if (!script) {
    script = document.createElement('script');
    script.id = 'enrollment-turnstile';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
  }
  const onError = () => { script.remove(); fail(); };
  removeListeners = () => { script.removeEventListener('load', renderWidget); script.removeEventListener('error', onError); };
  script.addEventListener('load', renderWidget, { once: true });
  script.addEventListener('error', onError, { once: true });
  if (created) document.head.appendChild(script);
}
function reset() {
  clearTimeoutAndListeners();
  attempt++;
  if (widget !== undefined) window.turnstile?.remove(widget);
  widget = undefined;
  // Retry a script request which never completed, instead of waiting on it forever.
  if (!window.turnstile) document.querySelector('#enrollment-turnstile')?.remove();
  load();
}
onMounted(load);
onBeforeUnmount(() => { mounted = false; attempt++; clearTimeoutAndListeners(); if (widget !== undefined) window.turnstile?.remove(widget); });
defineExpose({ reset });
</script>

<template>
  <div>
    <div ref="container" aria-label="Security check"></div>
    <p v-if="status === 'loading'" role="status">Loading security check…</p>
    <p v-else-if="status === 'verifying'" role="status">Waiting for security verification…</p>
    <p v-else-if="status === 'verified'" role="status">Security check complete.</p>
    <p v-else role="alert">
      {{ failureMessage }}
      <button type="button" @click="reset">Try again</button>
    </p>
  </div>
</template>
