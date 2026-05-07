<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../services/api'
import { TrashIcon } from '@heroicons/vue/24/outline'
import draggable from 'vuedraggable'
import UiToast from '../components/ui/UiToast.vue'
import UiConfirmModal from '../components/ui/UiConfirmModal.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const { toast, showToast, closeToast } = useToast()
const confirmRemove = ref({ open: false, blockName: '', exName: '', onConfirm: null })

const workout = ref(null)
const exercises = ref([])
const categories = ref([])

const isEdit = !!route.params.id

const MAX_FIELD_LEN = 255

const normalizeFieldForApi = (v) => {
  if (v == null) return null
  let s = String(v).trim()
  if (!s) return null
  if (s.length > MAX_FIELD_LEN) s = s.slice(0, MAX_FIELD_LEN)
  return s
}

// SAVE 
const saveWorkout = async () => {
  const payload = {
    name: workout.value.name,
    date: workout.value.date,
    blocks: workout.value.blocks.map(block => ({
      id: block.id,
      name: block.name,
      order: block.order,
      exercises: block.block_exercises.map(ex => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        type: ex.type,
        reps: ex.type === 'reps' ? normalizeFieldForApi(ex.reps) : null,
        time: ex.type === 'time' ? normalizeFieldForApi(ex.time) : null,
        intensity: normalizeFieldForApi(ex.intensity),
        order: ex.order
      }))
    }))
  }

  if (isEdit) {
    await apiFetch(`/workouts/${route.params.id}`, {
      method: 'PUT',
      body: payload
    })
  } else {
    await apiFetch('/workouts', {
      method: 'POST',
      body: payload
    })
  }

  router.push({
    path: '/workouts',
    query: { toast: isEdit ? 'updated' : 'saved' },
  })
}

// BLOQUES
const addBlock = () => {
  if (!workout.value.blocks) {
    workout.value.blocks = []
  }

  workout.value.blocks.push({
    id: null,
    name: 'Nuevo bloque',
    order: workout.value.blocks.length + 1,
    block_exercises: []
  })
}

const removeBlock = (blockToRemove) => {
  confirmRemove.value = {
    open: true,
    blockName: blockToRemove?.name || '',
    exName: '',
    onConfirm: () => {
      workout.value.blocks = workout.value.blocks.filter(b => b !== blockToRemove)
      confirmRemove.value.open = false
      showToast('success', 'Eliminado', 'Bloque eliminado.')
    },
  }
}

// EJERCICIOS
const addExercise = (block) => {
  block.block_exercises.push({
    id: null,
    exercise_id: null,
    exercise: { name: '' },
    type: 'reps',
    reps: null,
    time: null,
    intensity: null,
    order: block.block_exercises.length + 1,
    search: '',
    selectedCategory: 'all',
    dropdownOpen: false,
  })
}

const removeExercise = (block, exerciseToRemove) => {
  confirmRemove.value = {
    open: true,
    blockName: block?.name || '',
    exName: exerciseToRemove?.exercise?.name || '',
    onConfirm: () => {
      block.block_exercises = block.block_exercises.filter(ex => ex !== exerciseToRemove)
      confirmRemove.value.open = false
      showToast('success', 'Eliminado', 'Ejercicio quitado del bloque.')
    },
  }
}

const handleTypeChange = (ex) => {
  if (ex.type === 'reps') ex.time = null
  else ex.reps = null
}

const getValue = (ex) => {
  const raw = ex?.type === 'time' ? ex.time : ex.reps
  if (raw == null) return ''
  return String(raw)
}

const setMetricValue = (ex, raw) => {
  const s = String(raw ?? '').slice(0, MAX_FIELD_LEN)
  if (ex?.type === 'time') {
    ex.time = s === '' ? null : s
    ex.reps = null
  } else {
    ex.reps = s === '' ? null : s
    ex.time = null
  }
}

const setIntensityField = (ex, raw) => {
  const s = String(raw ?? '').slice(0, MAX_FIELD_LEN)
  ex.intensity = s === '' ? null : s
}

const updateOrder = (block) => {
  block.block_exercises.forEach((ex, index) => {
    ex.order = index + 1
  })
}

const updateBlockOrder = () => {
  workout.value.blocks.forEach((block, index) => {
    block.order = index + 1
  })
}

// FILTRO EJERCICIOS
const getFilteredExercises = (ex) => {
  return exercises.value
    .filter(e => {
      const matchName = e.name
        .toLowerCase()
        .includes((ex.search || '').toLowerCase())

      const selected = ex.selectedCategory
      const matchCategory =
        selected === 'none'
          ? !((e.categories || []).length > 0)
          : (selected && selected !== 'all')
            ? (e.categories || []).some(c => c.id == selected)
            : true

      return matchName && matchCategory
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 10)
}

const handleSelectExercise = (ex) => {
  ex.search = ''
  ex.selectedCategory = 'all'
  ex.dropdownOpen = false
}

const selectExercise = (ex, e) => {
  ex.exercise_id = e.id
  ex.exercise = e
  ex.search = ''
  ex.dropdownOpen = false
}

const openDropdown = (ex) => {
  ex.dropdownOpen = true
}

const closeDropdown = (ex) => {
  // Delay so option click can run before blur closes it
  setTimeout(() => {
    ex.dropdownOpen = false
  }, 120)
}

onMounted(async () => {
  if (isEdit) {
    const data = await apiFetch(`/workouts/${route.params.id}`)
    workout.value = data
  } else {
    workout.value = {
      name: '',
      date: '',
      blocks: []
    }
  }

  // Normalize UI-only fields + tipos API → texto para inputs
  for (const b of (workout.value?.blocks || [])) {
    for (const ex of (b.block_exercises || [])) {
      if (!ex.type) ex.type = 'reps'
      if (ex.selectedCategory == null || ex.selectedCategory === '') ex.selectedCategory = 'all'
      if (ex.search == null) ex.search = ''
      if (ex.dropdownOpen == null) ex.dropdownOpen = false

      if (ex.reps != null && typeof ex.reps !== 'string') ex.reps = String(ex.reps)
      if (ex.time != null && typeof ex.time !== 'string') ex.time = String(ex.time)
      if (ex.intensity != null && typeof ex.intensity !== 'string') ex.intensity = String(ex.intensity)

      if (ex.reps != null && String(ex.reps).length > MAX_FIELD_LEN) {
        ex.reps = String(ex.reps).slice(0, MAX_FIELD_LEN)
      }
      if (ex.time != null && String(ex.time).length > MAX_FIELD_LEN) {
        ex.time = String(ex.time).slice(0, MAX_FIELD_LEN)
      }
      if (ex.intensity != null && String(ex.intensity).length > MAX_FIELD_LEN) {
        ex.intensity = String(ex.intensity).slice(0, MAX_FIELD_LEN)
      }
    }
  }

  const exData = await apiFetch('/exercises?all=1')
  exercises.value = exData.data || exData

  const catData = await apiFetch('/categories')
  categories.value = catData
})

</script>

<template>
  <div class="px-6 py-8 text-white">
    <UiToast
      :open="toast.open"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      @close="closeToast"
    />

    <UiConfirmModal
      :open="confirmRemove.open"
      :title="confirmRemove.exName ? 'Quitar ejercicio' : 'Eliminar bloque'"
      :message="confirmRemove.exName
        ? `Vas a quitar ${confirmRemove.exName || 'este ejercicio'}${confirmRemove.blockName ? ` del bloque ${confirmRemove.blockName}` : ''}.`
        : `Vas a eliminar ${confirmRemove.blockName ? `el bloque ${confirmRemove.blockName}` : 'este bloque'}.`"
      :confirm-text="confirmRemove.exName ? 'Quitar' : 'Eliminar'"
      cancel-text="Cancelar"
      tone="danger"
      @confirm="confirmRemove.onConfirm && confirmRemove.onConfirm()"
      @cancel="confirmRemove.open = false"
    />

    <!-- Cabecera -->
    <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-4xl font-black tracking-tight">
          {{ isEdit ? 'Editar sesión' : 'Nueva sesión' }}
          <span class="ml-1 flex flex-col h-[3px] w-10 align-middle bg-lime-400" />
        </h1>
        <p class="mt-2 text-sm text-white/55">
          {{ isEdit ? 'Organiza bloques y ejercicios de la sesión.' : 'Crea una sesión y define su estructura.' }}
        </p>
      </div>
    </div>

    <div v-if="workout" class="mt-8 mx-auto w-full max-w-6xl xl:max-w-7xl">
      <!-- Datos sesión -->
      <div class="rounded-xl border border-white/10 bg-white/4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.8)]">
        <div class="border-b border-white/10 px-6 py-5">
          <div class="text-[11px] tracking-[0.22em] uppercase text-white/45">
            Detalles de la sesión
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-[11px] tracking-[0.22em] uppercase text-white/50">Nombre</label>
              <input
                v-model="workout.name"
                placeholder="Ej: Full body power blast"
                class="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[11px] tracking-[0.22em] uppercase text-white/50">Fecha</label>
              <input
                type="date"
                v-model="workout.date"
                class="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15 scheme-dark"
              />
            </div>
          </div>
        </div>

        <!-- Bloques -->
        <div class="px-6 py-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center justify-between gap-3 sm:justify-start">
              <div class="text-[11px] tracking-[0.22em] uppercase text-white/45">
                Bloques
              </div>
              <div class="text-xs text-white/45">
                {{ workout.blocks?.length ?? 0 }} bloque(s)
              </div>
            </div>

            <button
              type="button"
              @click="addBlock"
              class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-xs font-extrabold tracking-wide text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/8"
            >
              + AÑADIR BLOQUE
            </button>
          </div>

          <draggable
            v-model="workout.blocks"
            item-key="id"
            class="mt-4 flex flex-col gap-4"
            @change="updateBlockOrder"
            handle=".handle"
          >
            <template #item="{ element: block }">
              <div class="rounded-xl border border-white/10 bg-black/30">
                <div class="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="handle inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/65 transition hover:bg-white/8"
                      aria-label="Mover bloque"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="opacity-85">
                        <path d="M12 2v20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                        <path d="M2 12h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                        <path d="M12 2l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12 2l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12 22l-3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12 22l3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M2 12l3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M2 12l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M22 12l-3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M22 12l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>

                    <input
                      v-model="block.name"
                      class="w-full max-w-[420px] rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
                    />
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      @click="addExercise(block)"
                      class="inline-flex h-9 items-center justify-center rounded-md border border-lime-300/20 bg-lime-400 px-4 text-xs font-extrabold tracking-wide text-black shadow-[0_20px_45px_-30px_rgba(163,230,53,0.75)] transition hover:bg-lime-300"
                    >
                      + EJERCICIO
                    </button>

                    <button
                      type="button"
                      @click="removeBlock(block)"
                      class="inline-flex h-9 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-xs font-extrabold tracking-wide text-white/75 transition hover:bg-white/8"
                    >
                      ELIMINAR BLOQUE
                    </button>
                  </div>
                </div>

                <div class="px-5 py-4">
                  <draggable
                    v-model="block.block_exercises"
                    item-key="id"
                    class="flex flex-col gap-3"
                    @change="updateOrder(block)"
                    handle=".handle"
                  >
                    <template #item="{ element: ex }">
                      <div class="rounded-lg border border-white/10 bg-white/3 px-3 py-3">
                        <div class="flex flex-wrap items-center gap-2">
                          <!-- Búsqueda combinada (busca y guarda) -->
                          <div class="relative w-full sm:w-[380px] sm:flex-none">
                            <input
                              v-model="ex.search"
                              :placeholder="ex.exercise?.name || 'Buscar ejercicio...'"
                              :class="[
                                'w-full rounded-md border px-4 py-2.5 text-sm outline-none transition focus:ring-2',
                                ex.exercise?.name
                                  ? 'border-lime-300/40 bg-lime-400/10 text-white placeholder:text-lime-200/60 focus:border-lime-400/60 focus:ring-lime-400/20'
                                  : 'border-white/10 bg-white/5 text-white placeholder:text-white/35 focus:border-lime-400/40 focus:ring-lime-400/15'
                              ]"
                              @focus="openDropdown(ex)"
                              @blur="closeDropdown(ex)"
                            />

                            <!-- Botón para limpiar selección -->
                            <button
                              v-if="ex.exercise?.name"
                              type="button"
                              @click="ex.exercise = null; ex.exercise_id = null; ex.search = ''"
                              class="absolute right-2 top-1/2 inline-flex -translate-y-1/2 h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/50 hover:bg-white/8 hover:text-white/75"
                              aria-label="Limpiar"
                            >
                              ✕
                            </button>

                            <!-- Dropdown de búsqueda -->
                            <div
                              v-if="(ex.dropdownOpen || ex.search) && getFilteredExercises(ex).length"
                              class="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-white/10 bg-black/95 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.85)]"
                            >
                              <button
                                v-for="e in getFilteredExercises(ex)"
                                :key="e.id"
                                type="button"
                                @click="selectExercise(ex, e)"
                                @mousedown.prevent
                                class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                              >
                                <span class="font-semibold">{{ e.name }}</span>
                              </button>
                            </div>
                          </div>

                          <!-- Select categoría -->
                          <div class="relative w-full sm:w-[240px] sm:flex-none">
                            <select
                              v-model="ex.selectedCategory"
                              class="w-full appearance-none rounded-md border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white/85 outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15 scheme-dark"
                            >
                              <option value="all">Todas las categorías</option>
                              <option value="none">Sin categoría</option>
                              <option v-for="c in categories" :key="c.id" :value="c.id">
                                {{ c.name }}
                              </option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/45">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                              </svg>
                            </div>
                          </div>

                          <!-- Config compacta -->
                          <div class="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                            <div class="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                              <div class="relative min-w-0 flex-1 sm:flex-none">
                                <select
                                  v-model="ex.type"
                                  @change="handleTypeChange(ex)"
                                  class="h-10 w-full appearance-none rounded-md border border-white/10 bg-white/5 px-3 pr-10 text-sm text-white/85 outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15 scheme-dark sm:w-[170px]"
                                >
                                  <option value="reps">Repeticiones</option>
                                  <option value="time">Tiempo</option>
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/45">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                                  </svg>
                                </div>
                              </div>

                              <input
                                :value="getValue(ex)"
                                maxlength="255"
                                @input="setMetricValue(ex, $event.target.value)"
                                class="h-10 min-w-[120px] flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/90 outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15 sm:w-[160px] sm:flex-none"
                              />

                              <input
                                :value="ex.intensity ?? ''"
                                maxlength="255"
                                placeholder="Intensidad"
                                @input="setIntensityField(ex, $event.target.value)"
                                class="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white/90 outline-none transition placeholder:text-white/35 focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15 sm:w-[180px] md:w-[200px] sm:shrink-0"
                              />
                            </div>

                            <div class="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                class="handle inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/65 transition hover:bg-white/8"
                                aria-label="Mover"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="opacity-85">
                                  <path d="M12 2v20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                                  <path d="M2 12h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                                  <path d="M12 2l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                  <path d="M12 2l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                  <path d="M12 22l-3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                  <path d="M12 22l3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                  <path d="M2 12l3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                  <path d="M2 12l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                  <path d="M22 12l-3-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                  <path d="M22 12l-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                @click="removeExercise(block, ex)"
                                class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-400/20 bg-red-500/10 text-red-200 transition hover:bg-red-500/15"
                                aria-label="Eliminar"
                              >
                                <TrashIcon class="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </draggable>

                  <div v-if="!block.block_exercises?.length" class="mt-3 text-sm text-white/45">
                    Este bloque no tiene ejercicios aún.
                  </div>
                </div>
              </div>
            </template>
          </draggable>

          <div v-if="!workout.blocks?.length" class="mt-4 rounded-lg border border-white/10 bg-white/3 px-5 py-6 text-sm text-white/55">
            Aún no has creado bloques. Usa “AÑADIR BLOQUE” para empezar.
          </div>
        </div>

        <!-- Footer acciones -->
        <div class="flex flex-col gap-2 border-t border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            @click="router.push('/workouts')"
            class="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/8"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="saveWorkout"
            class="inline-flex h-10 items-center justify-center rounded-md border border-lime-300/20 bg-lime-400 px-5 text-sm font-extrabold tracking-wide text-black shadow-[0_20px_45px_-30px_rgba(163,230,53,0.75)] transition hover:bg-lime-300"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>

    <div v-else class="mt-10 text-sm text-white/55">
      Cargando...
    </div>
  </div>
</template>

<style scoped>
select {
  color-scheme: dark;
}

input[type='date'] {
  color-scheme: dark;
}

/* Best-effort: many browsers use the OS dropdown UI; this helps where supported. */
select option,
select optgroup {
  background-color: #0b0b0b;
  color: rgba(255, 255, 255, 0.9);
}
</style>