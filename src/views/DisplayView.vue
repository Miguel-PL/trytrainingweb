<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../services/api'
import { validateExerciseMediaUrl } from '../utils/videoUrl'

const route = useRoute()
const workout = ref(null)

const getGridClass = (count) => {
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count === 3) return 'grid-cols-3'
  if (count === 4) return 'grid-cols-4'
  return 'grid-cols-4'
}
const formatType = (ex) => {
  return ex.type === 'time'
    ? `${ex.value} segundos`
    : `${ex.value} repeticiones`
}

const formatPrimaryMetric = (ex) => {
  const value = ex?.value ?? ''
  if (ex?.type === 'time') return `${value} segundos`
  return `${value} repeticiones`
}

const getMedia = (ex) => {
  const candidate = ex?.video_url || ex?.videoUrl || ex?.video || ''
  const v = validateExerciseMediaUrl(candidate)
  return v.ok ? v : null
}

const parseIntensity = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) return null

  // Accept formats: "5/10", "5", "85%", "8/10"
  const percentMatch = s.match(/^(\d{1,3})\s*%$/)
  if (percentMatch) {
    const p = Math.max(0, Math.min(100, Number(percentMatch[1])))
    return { value: p, max: 100, percent: p, label: `${p}%` }
  }

  const fracMatch = s.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (fracMatch) {
    const v = Number(fracMatch[1])
    const m = Number(fracMatch[2])
    if (!Number.isFinite(v) || !Number.isFinite(m) || m <= 0) return null
    const p = Math.max(0, Math.min(100, Math.round((v / m) * 100)))
    return { value: v, max: m, percent: p, label: `${v}/${m}` }
  }

  const v = Number(s)
  if (!Number.isFinite(v)) return null
  // default assume /10
  const clamped = Math.max(0, Math.min(10, v))
  const p = Math.max(0, Math.min(100, Math.round((clamped / 10) * 100)))
  return { value: clamped, max: 10, percent: p, label: `${clamped}/10` }
}

const intensityTone = (percent) => {
  if (percent >= 75) return 'high'
  if (percent >= 45) return 'mid'
  return 'low'
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

const blockGridStyle = () => {
  const rows = Math.max(1, blocksCount())
  const cols = Math.max(1, maxExercises())
  // Global fixed grid: rows = blocks, cols = max exercises
  return {
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    // +1 column for block titles on the left
    gridTemplateColumns: `minmax(56px, 72px) repeat(${cols}, minmax(0, 1fr))`,
  }
}

const getExerciseAt = (block, idx) => {
  return block?.exercises?.[idx] ?? null
}

const tvVars = computed(() => {
  const rows = Math.max(1, blocksCount())
  const cols = Math.max(1, maxExercises())

  // Heuristic sizing for TV readability; higher density => smaller text.
  const name = Math.max(12, Math.round(22 - rows * 1.2 - cols * 1.2))
  const meta = Math.max(10, Math.round(name * 0.7))
  const block = Math.max(10, Math.round(name * 0.65))

  return {
    '--tv-name': `${name}px`,
    '--tv-meta': `${meta}px`,
    '--tv-block': `${block}px`,
  }
})

onMounted(async () => {
  workout.value = await apiFetch(`/workouts/${route.params.id}/display`)
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-black text-white" :style="tvVars">
    <div v-if="!workout" class="h-full w-full flex items-center justify-center text-sm text-white/55">
      Cargando...
    </div>

    <div v-else class="h-full w-full p-2">
      <div
        v-if="!(workout.blocks?.length > 0)"
        class="h-full w-full rounded-xl border border-white/10 bg-white/4 flex items-center justify-center text-sm text-white/55"
      >
        Esta sesión no tiene bloques.
      </div>

      <div
        v-else
        class="grid h-full gap-2"
        :style="blockGridStyle()"
      >
        <template v-for="(block, rowIdx) in workout.blocks" :key="block.name">
          <!-- Block title column (outside videos) -->
          <div
            class="min-w-0 min-h-0 overflow-hidden rounded-lg border border-white/10 bg-white/4 flex items-center justify-center px-3"
            :style="{ gridRow: rowIdx + 1, gridColumn: 1 }"
          >
            <div
              class="text-center font-black tracking-[0.22em] uppercase text-lime-200/90 select-none"
              :style="{
                fontSize: 'var(--tv-block)',
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
              }"
            >
              {{ block.name }}
            </div>
          </div>

          <div
            v-for="colIdx in Math.max(1, maxExercises())"
            :key="`${block.name}-${colIdx}`"
            class="min-w-0 min-h-0 overflow-hidden rounded-lg border border-white/10 bg-black/30 flex flex-col relative"
            :style="{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }"
          >
            <div v-if="getExerciseAt(block, colIdx - 1)" class="min-h-0 flex-1 bg-black/40">
              <iframe
                v-if="getMedia(getExerciseAt(block, colIdx - 1))?.kind === 'youtube'"
                :src="getMedia(getExerciseAt(block, colIdx - 1))?.embedUrl"
                class="h-full w-full"
                frameborder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowfullscreen
              />
              <video
                v-else-if="getMedia(getExerciseAt(block, colIdx - 1))?.kind === 'file'"
                :src="getMedia(getExerciseAt(block, colIdx - 1))?.url"
                autoplay
                loop
                muted
                playsinline
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="h-full w-full flex items-center justify-center text-[11px] tracking-[0.22em] uppercase text-white/40"
              >
                Sin vídeo
              </div>
            </div>

            <div
              v-else
              class="min-h-0 flex-1 bg-black/20"
            />

            <div v-if="getExerciseAt(block, colIdx - 1)" class="shrink-0 border-t border-white/10 bg-black/45">
              <div class="px-3 py-2">
                <div class="flex items-end justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-baseline justify-center gap-3 min-w-0">
                      <div
                        class="truncate font-black tracking-wide text-white/95"
                        :style="{ fontSize: 'var(--tv-name)', maxWidth: '70%' }"
                      >
                        {{ getExerciseAt(block, colIdx - 1).name }}
                      </div>
                      <div
                        class="shrink-0 font-black tracking-wide text-lime-200"
                        :style="{ fontSize: 'calc(var(--tv-name) * 1.15)' }"
                      >
                        {{ formatPrimaryMetric(getExerciseAt(block, colIdx - 1)) }}
                      </div>
                    </div>
                  </div>

                  <div class="shrink-0 text-right">
                    <div
                      v-if="parseIntensity(getExerciseAt(block, colIdx - 1).intensity)"
                      class="inline-flex items-center gap-2 rounded-md border px-2 py-1"
                      :class="{
                        'border-lime-300/20 bg-lime-400/15 text-lime-200': intensityTone(parseIntensity(getExerciseAt(block, colIdx - 1).intensity).percent) === 'low',
                        'border-amber-300/20 bg-amber-400/15 text-amber-200': intensityTone(parseIntensity(getExerciseAt(block, colIdx - 1).intensity).percent) === 'mid',
                        'border-red-400/20 bg-red-500/10 text-red-200': intensityTone(parseIntensity(getExerciseAt(block, colIdx - 1).intensity).percent) === 'high',
                      }"
                      :style="{ fontSize: 'var(--tv-meta)' }"
                    >
                      <span class="font-semibold">Intensidad</span>
                      <span class="font-extrabold">{{ parseIntensity(getExerciseAt(block, colIdx - 1).intensity).label }}</span>
                    </div>
                    <div
                      v-else
                      class="text-white/55 font-semibold"
                      :style="{ fontSize: 'var(--tv-meta)' }"
                    >
                      Intensidad: {{ getExerciseAt(block, colIdx - 1).intensity }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>