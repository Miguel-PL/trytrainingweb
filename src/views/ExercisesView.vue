<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiFetch } from '../services/api'
import { useRouter } from 'vue-router'
import { watch } from 'vue'

const router = useRouter()

const exercises = ref([])
const categories = ref([])

const currentPage = ref(1)
const lastPage = ref(1)

const fetchExercises = async (page = 1) => {
  let url = `/exercises?page=${page}`

  if (search.value) {
    url += `&name=${search.value}`
  }

  if (selectedCategory.value) {
    url += `&category_id=${selectedCategory.value}`
  }

  const response = await apiFetch(url)

  exercises.value = response.data
  currentPage.value = response.current_page
  lastPage.value = response.last_page
}

const deleteExercise = async (id) => {
  const ok = confirm('¿Eliminar ejercicio?')
  if (!ok) return

  await apiFetch(`/exercises/${id}`, { method: 'DELETE' })

  exercises.value = exercises.value.filter(e => e.id !== id)
}

const search = ref('')
const selectedCategory = ref('')

watch([search, selectedCategory], () => {
  fetchExercises(1)
})

onMounted(async () => {
  await fetchExercises()
  categories.value = await apiFetch('/categories')
})

</script>

<template>
  <div class="p-6 text-white">

    <h1 class="text-2xl mb-4">Ejercicios</h1>

    <div class="bg-gray-900 rounded p-4">

      <div class="flex gap-2 mb-4 items-center">

        <!-- BUSCADOR -->
        <input v-model="search" placeholder="Buscar ejercicio..." class="bg-gray-800 p-2 rounded flex-1" />

        <!-- CATEGORÍA -->
        <select v-model="selectedCategory" class="bg-gray-800 p-2 rounded">
          <option value="">Todas las categorias</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>

        <!-- BOTÓN -->
        <button @click="router.push('/exercises/create')" class="bg-green-500 px-4 py-2 rounded whitespace-nowrap">
          Crear ejercicio
        </button>

      </div>

      <table class="w-full text-left">
        <thead class="bg-gray-800 text-gray-400 text-sm">
          <tr>
            <th class="p-2">Nombre</th>
            <th class="p-2">Video</th>
            <th class="p-2">Categorías</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="ex in exercises" :key="ex.id" class="border-t border-gray-700">

            <td>{{ ex.name }}</td>

            <td>{{ ex.video_url }}</td>

            <td>
              <span v-for="c in ex.categories" :key="c.id" class="mr-2 text-sm text-green-400">
                {{ c.name }}
              </span>
            </td>

            <td class="flex gap-2">

              <button @click="router.push(`/exercises/${ex.id}/edit`)" class="text-blue-400">
                Editar
              </button>

              <button @click="deleteExercise(ex.id)" class="text-red-400">
                Eliminar
              </button>

            </td>

          </tr>
        </tbody>

      </table>
      <div class="flex justify-center gap-2 mt-4">

        <!-- ANTERIOR -->
        <button @click="fetchExercises(currentPage - 1)" :disabled="currentPage === 1"
          class="bg-gray-700 px-3 py-1 rounded disabled:opacity-50">
          ←
        </button>

        <!-- INFO -->
        <span>
          Página {{ currentPage }} de {{ lastPage }}
        </span>

        <!-- SIGUIENTE -->
        <button @click="fetchExercises(currentPage + 1)" :disabled="currentPage === lastPage"
          class="bg-gray-700 px-3 py-1 rounded disabled:opacity-50">
          →
        </button>

      </div>

    </div>
  </div>

</template>