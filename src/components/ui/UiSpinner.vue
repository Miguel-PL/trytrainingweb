<script setup>
defineProps({
  size: { type: String, default: 'sm' }, // sm, md, lg
})

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}
</script>

<template>
  <svg
    :class="[sizeClasses[size], 'animate-spin text-current']"
    style="animation: spin 1s linear infinite;"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-dasharray="15.7 47.1"
    />
  </svg>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
