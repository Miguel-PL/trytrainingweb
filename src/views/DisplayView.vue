<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch, unwrapWorkoutResponse } from '../services/api'
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

/** El JSON de display a veces trae nombre/vídeo en `exercise.*` en lugar de plano. */
const exerciseVideoCandidate = (ex) =>
  String(ex?.video_url ?? ex?.videoUrl ?? ex?.video ?? ex?.exercise?.video_url ?? '').trim()

const exerciseDisplayName = (ex) =>
  String(ex?.name ?? ex?.exercise?.name ?? '').trim()

const getMedia = (ex) => {
  const v = validateExerciseMediaUrl(exerciseVideoCandidate(ex))
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

  // minmax(0, 1fr): reparte el alto exacto del viewport sin forzar min-content (evita scroll vertical).
  // Columnas con minmax(0, 1fr) evitan desbordamiento horizontal cuando hay muchas tarjetas.
  if (isLowDensity.value) {
    return {
      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      gridTemplateColumns: `minmax(48px, 120px) repeat(${cols}, minmax(0, 1fr))`,
    }
  }

  return {
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    gridTemplateColumns: `minmax(40px, 72px) repeat(${cols}, minmax(0, 1fr))`,
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
  const raw = await apiFetch(`/workouts/${route.params.id}/display`)
  workout.value = unwrapWorkoutResponse(raw) ?? raw
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

    <div v-else class="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden p-2">

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
      <div class="grid min-h-0 min-w-0 flex-1 gap-2 overflow-hidden" :style="blockGridStyle()">

        <template v-for="(block, rowIdx) in workout.blocks" :key="block.name">

          <!-- BLOQUE -->
          <div
            class="flex min-h-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"
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
            class="flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-white/10 bg-zinc-900"
            :style="{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }"
          >
            <template v-if="getExerciseAt(block, colIdx - 1)">

              <!-- VIDEO: ocupa el hueco flexible de la celda (altura total pantalla − cabecera − texto) -->
              <div class="relative min-h-0 w-full flex-1 overflow-hidden bg-black">
                <iframe
                  v-if="getMedia(getExerciseAt(block, colIdx - 1))?.kind === 'youtube'"
                  :src="getMedia(getExerciseAt(block, colIdx - 1))?.embedUrl"
                  title="Vídeo del ejercicio"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  referrerpolicy="strict-origin-when-cross-origin"
                  class="pointer-events-none absolute left-1/2 top-1/2 h-[142%] w-[142%] -translate-x-1/2 -translate-y-1/2 border-0"
                />

                <video
                  v-else-if="getMedia(getExerciseAt(block, colIdx - 1))?.kind === 'file'"
                  :src="getMedia(getExerciseAt(block, colIdx - 1))?.url"
                  autoplay
                  loop
                  muted
                  playsinline
                  preload="auto"
                  class="absolute inset-0 h-full w-full object-cover"
                />

                <!--
                  YouTube no permite ocultar por completo los overlays (pause / atrás / siguiente)
                  dentro del iframe; en bucles cortos reaparecen cada ciclo. Esta capa tapa la banda
                  inferior donde suelen dibujarse (sin pointer-events: no bloqueamos el vídeo).
                -->
                <div
                  v-if="getMedia(getExerciseAt(block, colIdx - 1))?.kind === 'youtube'"
                  class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[28%]"
                  style="background: linear-gradient(to top, rgb(0 0 0) 0%, rgb(0 0 0 / 0.96) 32%, transparent 100%);"
                  aria-hidden="true"
                />

                <div
                  class="pointer-events-none absolute inset-0 z-[11]"
                  :class="
                    getMedia(getExerciseAt(block, colIdx - 1))?.kind === 'youtube'
                      ? 'bg-black/25'
                      : 'bg-black/30'
                  "
                />
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
                    :title="exerciseDisplayName(getExerciseAt(block, colIdx - 1))"
                  >
                    <span class="block line-clamp-2 break-words">
                      {{ exerciseDisplayName(getExerciseAt(block, colIdx - 1)) }}
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
