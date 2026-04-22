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
  <div class="p-6 text-white">

    <h1 class="text-2xl mb-4">Editar sesión</h1>
    <button @click="addBlock" class="bg-blue-500 text-white px-3 py-1 rounded mb-4">
      + Añadir bloque
    </button>

    <div v-if="workout">
      <input v-model="workout.name" class="bg-gray-800 text-white p-2 rounded w-full mb-2" />

      <input type="date" v-model="workout.date" class="bg-gray-800 text-white p-2 rounded w-full mb-4" />

      <draggable v-model="workout.blocks" item-key="id" class="flex flex-col gap-4" @change="updateBlockOrder"
        handle=".handle">
        <template #item="{ element: block }">

          <div class="mb-4 bg-gray-900 p-4 rounded">

            <div class="flex justify-between items-center mb-2">

              <!-- IZQUIERDA -->
              <div class="flex items-center gap-2">

                <!-- HANDLE -->
                <span class="handle cursor-move text-gray-400 hover:text-white">
                  ☰
                </span>

                <!-- INPUT NOMBRE -->
                <input v-model="block.name" class="bg-gray-700 text-white p-2 rounded" />

              </div>

              <!-- DERECHA -->
              <div class="flex gap-2">
                <button @click="addExercise(block)" class="bg-green-500 px-3 py-1 rounded text-sm">
                  + Ejercicio
                </button>

                <button @click="removeBlock(block)" class="bg-red-500 px-3 py-1 rounded text-sm">
                  Eliminar
                </button>
              </div>

            </div>

            <draggable v-model="block.block_exercises" item-key="id" class="flex flex-col gap-4"
              @change="updateOrder(block)" handle=".handle">
              <template #item="{ element: ex }">

                <div class="flex gap-2 items-center w-full">

                  <!-- IZQUIERDA -->
                  <div class="flex gap-2 flex-1 items-start">

                    <!-- BUSCADOR -->
                    <div class="relative flex-1">

                      <input v-model="ex.search" placeholder="Buscar ejercicio..."
                        class="bg-gray-800 text-white p-2 rounded w-full" />

                      <!-- RESULTADOS -->
                      <div v-if="ex.search && getFilteredExercises(ex).length"
                        class="absolute z-10 bg-gray-900 border border-gray-700 w-full max-h-40 overflow-y-auto mt-1 rounded">
                        <div v-for="e in getFilteredExercises(ex)" :key="e.id" @click="selectExercise(ex, e)"
                          class="p-2 hover:bg-gray-700 cursor-pointer">
                          {{ e.name }}
                        </div>
                      </div>

                      <!-- SELECCIONADO -->
                      <div class="mt-1 h-6 flex items-center">

                        <div v-if="ex.exercise?.name"
                          class="bg-green-600 text-white px-10 py-1 rounded flex items-center gap-1 mt-3">
                          {{ ex.exercise.name }}
                          <span @click="ex.exercise = null; ex.exercise_id = null" class="cursor-pointer text-xs">
                            ✕
                          </span>
                        </div>

                        <div v-else class="text-gray-500 text-xs">
                          Selecciona un ejercicio.
                        </div>

                      </div>

                    </div>

                    <!-- CATEGORÍA -->
                    <select v-model="ex.selectedCategory" class="bg-gray-800 text-white p-2 rounded w-40">
                      <option value="">Todas</option>
                      <option v-for="c in categories" :key="c.id" :value="c.id">
                        {{ c.name }}
                      </option>
                    </select>

                  </div>

                  <!-- DERECHA -->
                  <select v-model="ex.type" @change="handleTypeChange(ex)"
                    class="bg-gray-800 text-white p-2 rounded w-32">
                    <option value="reps">Reps</option>
                    <option value="time">Tiempo</option>
                  </select>

                  <input v-model="ex.reps" placeholder="reps" :disabled="ex.type !== 'reps'"
                    class="bg-gray-800 text-white p-2 rounded w-24" @input="ex.time = null" />

                  <input v-model="ex.time" placeholder="seg" :disabled="ex.type !== 'time'"
                    class="bg-gray-800 text-white p-2 rounded w-24" @input="ex.reps = null" />

                  <!-- ICONOS -->
                  <span class="handle cursor-move text-gray-400 hover:text-white">
                    ☰
                  </span>

                  <button @click="removeExercise(block, ex)" class="p-1 hover:bg-gray-700 rounded">
                    <TrashIcon class="h-4 w-4 text-red-500" />
                  </button>

                </div>

              </template>
            </draggable>
          </div>


        </template>
      </draggable>
    </div>
  </div>

  <button @click="saveWorkout" class="bg-green-500 text-black px-4 py-2 rounded mt-4">
    Guardar cambios
  </button>

</template>