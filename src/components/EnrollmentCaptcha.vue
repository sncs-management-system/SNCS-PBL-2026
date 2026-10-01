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
const failed = ref(false);
let widget: string | undefined;
let mounted = true;

function renderWidget() {
  if (!mounted || !container.value || !window.turnstile) return;
  widget = window.turnstile.render(container.value, {
    sitekey: props.siteKey, action: 'enrollment', theme: 'light', size: 'flexible',
    callback: (token: string) => { failed.value = false; emit('token', token); },
    'expired-callback': () => emit('token', ''),
    'error-callback': () => { failed.value = true; emit('token', ''); },
  });
}
function load() {
  failed.value = false;
  if (window.turnstile) { renderWidget(); return; }
  let script = document.querySelector<HTMLScriptElement>('#enrollment-turnstile');
  if (!script) {
    script = document.createElement('script');
    script.id = 'enrollment-turnstile';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  script.addEventListener('load', renderWidget, { once: true });
  script.addEventListener('error', () => { failed.value = true; script?.remove(); }, { once: true });
}
function reset() {
  emit('token', '');
  if (widget !== undefined) window.turnstile?.reset(widget);
}
onMounted(load);
onBeforeUnmount(() => { mounted = false; if (widget !== undefined) window.turnstile?.remove(widget); });
defineExpose({ reset });
</script>

<template>
  <div>
    <div ref="container" aria-label="Security check"></div>
    <p v-if="failed" role="alert">
      The security check could not load. Check your connection.
      <button type="button" @click="widget === undefined ? load() : reset()">Try again</button>
    </p>
  </div>
</template>
