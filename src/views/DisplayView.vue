<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../services/api'
import { validateExerciseMediaUrl } from '../utils/videoUrl'

const route = useRoute()
const workout = ref(null)
const isFullscreen = ref(false)

const getFullscreenElement = () =>
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.msFullscreenElement

const syncFullscreenState = () => {
  isFullscreen.value = Boolean(getFullscreenElement())
}

const toggleFullscreen = async () => {
  const root = document.documentElement
  const active = getFullscreenElement()

  try {
    if (!active) {
      if (root.requestFullscreen) await root.requestFullscreen()
      else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen()
      else if (root.msRequestFullscreen) root.msRequestFullscreen()
    } else {
      if (document.exitFullscreen) await document.exitFullscreen()
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen()
      else if (document.msExitFullscreen) document.msExitFullscreen()
    }
  } catch (err) {
    console.error('Error fullscreen:', err)
  } finally {
    syncFullscreenState()
  }
}

let fullscreenSinkAttached = false
let fullscreenAbort

const attachFullscreenSync = () => {
  if (fullscreenSinkAttached) return
  fullscreenSinkAttached = true
  fullscreenAbort = new AbortController()
  const opts = { signal: fullscreenAbort.signal }
  document.addEventListener('fullscreenchange', syncFullscreenState, opts)
  document.addEventListener('webkitfullscreenchange', syncFullscreenState, opts)
  document.addEventListener('MSFullscreenChange', syncFullscreenState, opts)
}

const getPrimaryMetricRawString = (ex) => {
  if (!ex) return ''
  const v = ex.value ?? (ex.type === 'time' ? ex.time : ex.reps) ?? ''
  return String(v)
}

const formatPrimaryMetric = (ex) => {
  const rawStr = getPrimaryMetricRawString(ex)
  const trimmed = rawStr.trim()
  if (!trimmed) return ''
  if (ex?.type === 'time') return trimmed
  return `${trimmed} REPS`
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

  const base = Math.max(11, Math.round(21 - rows * 1.2 - cols * 1.2))

  return {
    '--tv-name': `${isLowDensity.value ? base * 1.35 : base * 1.05}px`,
    '--tv-meta': `${base * 0.9}px`,
    '--tv-block': `${base * 1.5}px`,
  }
})

onMounted(async () => {
  attachFullscreenSync()
  syncFullscreenState()
  workout.value = await apiFetch(`/workouts/${route.params.id}/display`)
})

onUnmounted(() => {
  fullscreenAbort?.abort()
  fullscreenSinkAttached = false
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
            class="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden flex flex-col h-full min-h-0 min-w-0"
            :style="{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }"
          >
            <template v-if="getExerciseAt(block, colIdx - 1)">

              <!-- VIDEO: altura fija por ancho (16:9); no se encoge por el texto -->
              <div class="relative w-full shrink-0 aspect-video overflow-hidden bg-black">
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

              <!-- INFO: texto acotado; nombre con ellipsis si no cabe -->
              <div
                class="flex flex-col shrink-0 px-3 py-2 min-h-0 overflow-hidden"
                :class="isLowDensity ? 'gap-1.5' : 'gap-1'"
              >
                <!-- NOMBRE + MÉTRICA -->
                <div class="flex items-start justify-between gap-2 min-w-0">
                  <div
                    class="uppercase font-bold text-white/95 min-w-0 flex-1 overflow-hidden leading-snug"
                    :style="{
                      fontSize: isLowDensity
                        ? 'calc(var(--tv-name) * 1.35)'
                        : 'calc(var(--tv-name) * 1.0)',
                    }"
                    :title="getExerciseAt(block, colIdx - 1).name"
                  >
                    <span class="block line-clamp-2 break-words">
                      {{ getExerciseAt(block, colIdx - 1).name }}
                    </span>
                  </div>
                  <div
                    v-if="formatPrimaryMetric(getExerciseAt(block, colIdx - 1))"
                    class="shrink-0 max-w-[42%] text-right font-black leading-tight text-lime-300 whitespace-normal break-words line-clamp-2"
                    :style="{
                      fontSize: isLowDensity
                        ? 'calc(var(--tv-name) * 1.55)'
                        : 'calc(var(--tv-name) * 1.05)'
                    }"
                  >
                    {{ formatPrimaryMetric(getExerciseAt(block, colIdx - 1)) }}
                  </div>
                </div>

                <!-- INTENSIDAD -->
                <div
                  v-if="parseIntensity(getExerciseAt(block, colIdx - 1).intensity)"
                  class="text-white/65 font-semibold min-w-0 truncate"
                  :style="{
                    fontSize: 'calc(var(--tv-meta) * 1.05)',
                    marginTop: isLowDensity ? '2px' : '4px'
                  }"
                  :title="`Intensidad · ${parseIntensity(getExerciseAt(block, colIdx - 1).intensity).label}`"
                >
                  <span class="uppercase tracking-wide text-white/55">Intensidad</span>
                  <span class="mx-2 text-white/35">·</span>
                  <span class="font-extrabold text-white/80">
                    {{ parseIntensity(getExerciseAt(block, colIdx - 1).intensity).label }}
                  </span>
                </div>

              </div>

              <!-- Altura extra de la celda (no reduce el vídeo) -->
              <div class="min-h-0 flex-1" aria-hidden="true" />

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
