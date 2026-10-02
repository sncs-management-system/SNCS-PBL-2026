<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

type Turnstile = {
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
    : code && /^(300|600)/.test(code)
      ? 'Security verification failed. Try again, or use another browser if it keeps failing.'
      : 'The security check could not load. Check your connection and try again.';
  emit('token', '');
}

function renderWidget() {
  if (!mounted || !window.turnstile || !container.value || widget !== undefined) return;
  clearTimeoutAndListeners();
  status.value = 'verifying';
  // Stop a stalled or invisible challenge from leaving an unexplained blank area.
  timeout = setTimeout(() => fail(), 60_000);
  try {
    widget = window.turnstile.render(container.value, {
      sitekey: props.siteKey, action: 'enrollment', theme: 'light', size: 'flexible',
      callback: (token: string) => {
        if (!mounted) return;
        clearTimeoutAndListeners(); status.value = 'verified'; emit('token', token);
      },
      'before-interactive-callback': () => { if (mounted) clearTimeout(timeout); },
      'expired-callback': () => { if (mounted) fail(); },
      'timeout-callback': () => { if (mounted) fail(); },
      'error-callback': (code: string) => { if (mounted) fail(code); },
    });
  } catch { fail(); }
}
function load() {
  clearTimeoutAndListeners();
  status.value = 'loading';
  failureMessage.value = '';
  emit('token', '');
  timeout = setTimeout(() => fail(), 20_000);
  let script = document.querySelector<HTMLScriptElement>('#enrollment-turnstile');
  if (window.turnstile && (!script || script.dataset.loaded === 'true')) { renderWidget(); return; }
  const created = !script;
  if (!script) {
    script = document.createElement('script');
    script.id = 'enrollment-turnstile';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
  }
  const onError = () => { script.remove(); fail(); };
  const onLoad = () => { script.dataset.loaded = 'true'; renderWidget(); };
  removeListeners = () => { script.removeEventListener('load', onLoad); script.removeEventListener('error', onError); };
  script.addEventListener('load', onLoad, { once: true });
  script.addEventListener('error', onError, { once: true });
  if (created) document.head.appendChild(script);
}
function reset() {
  clearTimeoutAndListeners();
  emit('token', '');
  if (widget !== undefined && window.turnstile) {
    // Keep the iframe mounted and let Cloudflare reset its own challenge state.
    // Removing and recreating it on every retry changes the original lifecycle.
    status.value = 'verifying';
    timeout = setTimeout(() => fail(), 60_000);
    try { window.turnstile.reset(widget); } catch { fail(); }
  } else {
    document.querySelector('#enrollment-turnstile')?.remove();
    load();
  }
}
onMounted(load);
onBeforeUnmount(() => { mounted = false; clearTimeoutAndListeners(); if (widget !== undefined) window.turnstile?.remove(widget); });
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
