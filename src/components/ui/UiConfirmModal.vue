<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  loading: { type: Boolean, default: false },
  tone: { type: String, default: 'danger' }, // danger | neutral
})

defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div v-if="props.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('cancel')" />
    <div class="relative mx-auto flex min-h-full max-w-lg items-center justify-center px-4">
      <div class="w-full rounded-2xl border border-white/10 bg-black/85 p-5 shadow-[0_30px_80px_-55px_rgba(0,0,0,0.9)] backdrop-blur">
        <div class="flex items-start gap-3">
          <div
            class="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
            :class="props.tone === 'danger'
              ? 'border-red-400/20 bg-red-500/10 text-red-200'
              : 'border-white/10 bg-white/5 text-white/80'"
          >
            <span class="text-lg font-black">{{ props.tone === 'danger' ? '!' : '?' }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-sm font-extrabold tracking-wide text-white/90">{{ props.title }}</div>
            <div class="mt-1 text-sm text-white/60">
              {{ props.message }}
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/8"
            :disabled="props.loading"
            @click="$emit('cancel')"
          >
            {{ props.cancelText }}
          </button>
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-extrabold tracking-wide transition disabled:opacity-60"
            :class="props.tone === 'danger'
              ? 'border-red-400/20 bg-red-500/10 text-red-100 hover:bg-red-500/15'
              : 'border-lime-300/20 bg-lime-400 text-black hover:bg-lime-300'"
            :disabled="props.loading"
            @click="$emit('confirm')"
          >
            {{ props.loading ? 'Procesando...' : props.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

