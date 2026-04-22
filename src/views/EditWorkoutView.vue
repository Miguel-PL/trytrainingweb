<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../services/api'
import { TrashIcon } from '@heroicons/vue/24/outline'
import draggable from 'vuedraggable'

const router = useRouter()
const route = useRoute()

const workout = ref(null)
const exercises = ref([])
const categories = ref([])

const isEdit = !!route.params.id

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
        reps: ex.reps,
        time: ex.time,
        intensity: ex.intensity,
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

  router.push('/workouts')
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
  workout.value.blocks = workout.value.blocks.filter(
    b => b !== blockToRemove
  )
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
    intensity: '5/10',
    order: block.block_exercises.length + 1,
    search: '',
    selectedCategory: ''
  })
}

const removeExercise = (block, exerciseToRemove) => {
  const ok = confirm('¿Eliminar ejercicio?')
  if (!ok) return

  block.block_exercises = block.block_exercises.filter(
    ex => ex !== exerciseToRemove
  )
}

const handleTypeChange = (ex) => {
  if (ex.type === 'reps') ex.time = null
  else ex.reps = null
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

      const matchCategory = ex.selectedCategory
        ? (e.categories || []).some(c => c.id == ex.selectedCategory)
        : true

      return matchName && matchCategory
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 10)
}

const handleSelectExercise = (ex) => {
  ex.search = ''
  ex.selectedCategory = ''
}

const selectExercise = (ex, e) => {
  ex.exercise_id = e.id
  ex.exercise = e
  ex.search = ''
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

  const exData = await apiFetch('/exercises?all=1')
  exercises.value = exData.data || exData

  const catData = await apiFetch('/categories')
  categories.value = catData
})

</script>

<template>
  <div class="px-6 py-8 text-white">
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

    <div v-if="workout" class="mt-8 mx-auto w-full max-w-5xl">
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
                      ☰
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
                      <div class="rounded-lg border border-white/10 bg-white/3 px-4 py-4">
                        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                          <!-- Selección -->
                          <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                            <div class="relative w-full flex-1">
                              <input
                                v-model="ex.search"
                                placeholder="Buscar ejercicio..."
                                class="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
                              />

                              <div
                                v-if="ex.search && getFilteredExercises(ex).length"
                                class="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-white/10 bg-black/95 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.85)]"
                              >
                                <button
                                  v-for="e in getFilteredExercises(ex)"
                                  :key="e.id"
                                  type="button"
                                  @click="selectExercise(ex, e)"
                                  class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                                >
                                  <span class="font-semibold">{{ e.name }}</span>
                                </button>
                              </div>

                              <div class="mt-2 min-h-[28px]">
                                <div
                                  v-if="ex.exercise?.name"
                                  class="inline-flex items-center gap-2 rounded-md border border-lime-300/20 bg-lime-400/15 px-3 py-2 text-xs font-semibold text-lime-200"
                                >
                                  {{ ex.exercise.name }}
                                  <button
                                    type="button"
                                    @click="ex.exercise = null; ex.exercise_id = null"
                                    class="rounded px-1 text-lime-200/80 hover:text-lime-200"
                                    aria-label="Quitar"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <div v-else class="text-xs text-white/40">
                                  Selecciona un ejercicio.
                                </div>
                              </div>
                            </div>

                            <div class="w-full sm:w-[220px]">
                              <select
                                v-model="ex.selectedCategory"
                                class="w-full appearance-none rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15 scheme-dark"
                              >
                                <option value="">Todas</option>
                                <option v-for="c in categories" :key="c.id" :value="c.id">
                                  {{ c.name }}
                                </option>
                              </select>
                            </div>
                          </div>

                          <!-- Config -->
                          <div class="flex flex-wrap items-center justify-end gap-2 lg:flex-nowrap">
                            <select
                              v-model="ex.type"
                              @change="handleTypeChange(ex)"
                              class="w-[140px] rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/85 outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15 scheme-dark"
                            >
                              <option value="reps">Reps</option>
                              <option value="time">Tiempo</option>
                            </select>

                            <input
                              v-model="ex.reps"
                              placeholder="reps"
                              :disabled="ex.type !== 'reps'"
                              class="w-[110px] rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/90 outline-none transition disabled:opacity-40 focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
                              @input="ex.time = null"
                            />

                            <input
                              v-model="ex.time"
                              placeholder="seg"
                              :disabled="ex.type !== 'time'"
                              class="w-[110px] rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/90 outline-none transition disabled:opacity-40 focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
                              @input="ex.reps = null"
                            />

                            <button
                              type="button"
                              class="handle inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/65 transition hover:bg-white/8"
                              aria-label="Mover"
                            >
                              ☰
                            </button>

                            <button
                              type="button"
                              @click="removeExercise(block, ex)"
                              class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/8"
                              aria-label="Eliminar"
                            >
                              <TrashIcon class="h-4 w-4 text-red-400" />
                            </button>
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