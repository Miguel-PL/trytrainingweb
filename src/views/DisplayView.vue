<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../services/api'
import { validateExerciseMediaUrl } from '../utils/videoUrl'

const route = useRoute()
const workout = ref(null)
const isFullscreen = ref(false)

const toggleFullscreen = async () => {
  const elem = document.documentElement
  if (!isFullscreen.value) {
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
        isFullscreen.value = true
      }
    } catch (err) {
      console.error('Error entering fullscreen:', err)
    }
  } else {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        isFullscreen.value = false
      }
    } catch (err) {
      console.error('Error exiting fullscreen:', err)
    }
  }
}

const formatPrimaryMetric = (ex) => {
  const value = ex?.value ?? ''
  if (ex?.type === 'time') return `${value} SEC`
  return `${value} REPS`
}

const getMedia = (ex) => {
  const candidate = ex?.video_url || ex?.videoUrl || ex?.video || ''
  const v = validateExerciseMediaUrl(candidate)
  return v.ok ? v : null
}

const parseIntensity = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) return null

  const percentMatch = s.match(/^(\d{1,3})\s*%$/)
  if (percentMatch) {
    const p = Math.max(0, Math.min(100, Number(percentMatch[1])))
    return { label: `${p}%` }
  }

  const fracMatch = s.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fracMatch) {
    return { label: `${fracMatch[1]}/${fracMatch[2]}` }
  }

  const v = Number(s)
  if (!Number.isFinite(v)) return null
  return { label: `${v}/10` }
}

const blocksCount = () => (workout.value?.blocks?.length ?? 0)

const maxExercises = () => {
  const blocks = workout.value?.blocks || []
  let max = 0
  for (const b of blocks) {
    max = Math.max(max, b?.exercises?.length ?? 0)
  }
  return max
}

const totalExercises = () => {
  return workout.value?.blocks?.reduce(
    (acc, b) => acc + (b.exercises?.length || 0),
    0
  ) || 0
}

const isLowDensity = computed(() => totalExercises() <= 6)

const blockGridStyle = () => {
  const rows = Math.max(1, blocksCount())
  const cols = Math.max(1, maxExercises())

  if (isLowDensity.value) {
    return {
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gridTemplateColumns: `minmax(80px, 120px) repeat(${cols}, 1fr)`,
    }
  }

  return {
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gridTemplateColumns: `minmax(56px, 72px) repeat(${cols}, 1fr)`,
  }
}

const getExerciseAt = (block, idx) => {
  return block?.exercises?.[idx] ?? null
}

const tvVars = computed(() => {
  const rows = Math.max(1, blocksCount())
  const cols = Math.max(1, maxExercises())

  const base = Math.max(10, Math.round(22 - rows * 1.2 - cols * 1.2))

  return {
    '--tv-name': `${isLowDensity.value ? base * 1.3 : base}px`,
    '--tv-meta': `${base * 0.7}px`,
    '--tv-block': `${base * 0.7}px`,
  }
})

onMounted(async () => {
  workout.value = await apiFetch(`/workouts/${route.params.id}/display`)
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-black text-white" :style="tvVars">

    <div v-if="!workout" class="h-full flex items-center justify-center text-white/50">
      Cargando...
    </div>

    <div v-else class="h-full w-full p-2 flex flex-col gap-2">

      <!-- HEADER -->
      <div class="shrink-0 flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2 text-[10px] uppercase text-white/50">
            <span class="w-2 h-2 bg-lime-400 rounded-full"></span>
            Sesión activa
          </div>
          <div class="font-black uppercase truncate" style="font-size: 36px">
            {{ workout?.name || 'Entrenamiento' }}
          </div>
        </div>

        <button
          @click="toggleFullscreen"
          class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-lime-400/40"
          :title="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
          aria-label="Toggle fullscreen"
        >
          <svg v-if="!isFullscreen" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 7V3h4M3 17v4h4M21 7V3h-4M21 17v4h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M8 3v4H4M16 3v4h4M8 21v-4H4M16 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <!-- GRID -->
      <div class="grid flex-1 gap-2 min-h-0" :style="blockGridStyle()">

        <template v-for="(block, rowIdx) in workout.blocks" :key="block.name">

          <!-- BLOQUE -->
          <div
            class="flex items-center justify-center bg-white/5 rounded-xl border border-white/10"
            :style="{ gridRow: rowIdx + 1, gridColumn: 1 }"
          >
            <div
              class="font-black uppercase text-lime-300 tracking-wider"
              style="writing-mode: vertical-rl; transform: rotate(180deg); font-size: var(--tv-block);"
            >
              {{ block.name }}
            </div>
          </div>

          <!-- EJERCICIOS -->
          <div
            v-for="colIdx in Math.max(1, maxExercises())"
            :key="`${block.name}-${colIdx}`"
            class="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden flex flex-col"
            :style="{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }"
          >
            <template v-if="getExerciseAt(block, colIdx - 1)">

              <!-- VIDEO -->
              <div
                class="relative w-full overflow-hidden"
                :style="{ height: isLowDensity ? '70%' : '60%' }"
              >
                <iframe
                  v-if="getMedia(getExerciseAt(block, colIdx - 1))?.kind === 'youtube'"
                  :src="getMedia(getExerciseAt(block, colIdx - 1))?.embedUrl"
                  class="absolute top-1/2 left-1/2 w-[140%] h-[140%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                />

                <video
                  v-else-if="getMedia(getExerciseAt(block, colIdx - 1))?.kind === 'file'"
                  :src="getMedia(getExerciseAt(block, colIdx - 1))?.url"
                  autoplay loop muted playsinline
                  class="absolute inset-0 w-full h-full object-cover"
                />

                <div class="absolute inset-0 bg-black/30" />
              </div>

              <!-- INFO -->
              <div
                class="flex flex-col flex-1 p-3"
                :class="isLowDensity ? 'justify-center gap-3' : 'justify-between'"
              >
                <!-- NOMBRE + MÉTRICA -->
                <div class="flex items-baseline justify-between gap-3 min-w-0">
                  <div
                    class="uppercase font-bold truncate text-white/95"
                    :style="{
                      fontSize: isLowDensity
                        ? 'calc(var(--tv-name) * 1.25)'
                        : 'var(--tv-name)'
                    }"
                    :title="getExerciseAt(block, colIdx - 1).name"
                  >
                    {{ getExerciseAt(block, colIdx - 1).name }}
                  </div>
                  <div
                    class="shrink-0 font-black leading-none text-lime-300"
                    :style="{
                      fontSize: isLowDensity
                        ? 'calc(var(--tv-name) * 2.25)'
                        : 'calc(var(--tv-name) * 1.8)'
                    }"
                  >
                    {{ formatPrimaryMetric(getExerciseAt(block, colIdx - 1)) }}
                  </div>
                </div>

                <!-- INTENSIDAD -->
                <div
                  v-if="parseIntensity(getExerciseAt(block, colIdx - 1).intensity)"
                  class="text-white/65 font-semibold"
                  :style="{
                    fontSize: 'var(--tv-meta)',
                    marginTop: isLowDensity ? '2px' : '6px'
                  }"
                >
                  <span class="uppercase tracking-wide text-white/55">Intensidad</span>
                  <span class="mx-2 text-white/35">·</span>
                  <span class="font-extrabold text-white/80">
                    {{ parseIntensity(getExerciseAt(block, colIdx - 1).intensity).label }}
                  </span>
                </div>

              </div>

            </template>

            <!-- EMPTY -->
            <div v-else class="flex items-center justify-center h-full text-white/20 text-xl">
              —
            </div>

          </div>

        </template>
      </div>
    </div>
  </div>
</template>
