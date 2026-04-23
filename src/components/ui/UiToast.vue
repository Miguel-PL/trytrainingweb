<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  type: { type: String, default: 'success' }, // success | error
  title: { type: String, default: '' },
  message: { type: String, default: '' },
})

defineEmits(['close'])
</script>

<template>
  <div
    v-if="props.open"
    class="fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))]"
    role="status"
    aria-live="polite"
  >
    <div
      class="rounded-xl border bg-black/80 p-4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.85)] backdrop-blur"
      :class="props.type === 'success' ? 'border-lime-300/20' : 'border-red-400/20'"
    >
      <div class="flex items-start gap-3">
        <div
          class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border"
          :class="props.type === 'success'
            ? 'border-lime-300/20 bg-lime-400/15 text-lime-200'
            : 'border-red-400/20 bg-red-500/10 text-red-200'"
        >
          <span class="text-base font-black leading-none">
            {{ props.type === 'success' ? '✓' : '!' }}
          </span>
        </div>

        <div class="min-w-0 flex-1">
          <div class="text-sm font-extrabold tracking-wide text-white/90">
            {{ props.title }}
          </div>
          <div class="mt-0.5 text-sm text-white/65">
            {{ props.message }}
          </div>
        </div>

        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/8"
          aria-label="Cerrar"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

