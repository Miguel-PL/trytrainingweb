<script setup>
import { onMounted, ref, watch } from 'vue'
import { apiFetch } from '../services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

const workouts = ref([])
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)

const fetchWorkouts = async (page = 1) => {
  let url = `/workouts?page=${page}`

  if (search.value) {
    url += `&name=${search.value}`
  }

  const response = await apiFetch(url)

  workouts.value = response.data
  currentPage.value = response.current_page
  lastPage.value = response.last_page
}

onMounted(() => {
  fetchWorkouts()
})

watch(search, () => {
  fetchWorkouts(1)
})

const deleteWorkout = async (id) => {
  const ok = confirm('¿Seguro que quieres borrar esta sesión?')
  if (!ok) return

  await apiFetch(`/workouts/${id}`, { method: 'DELETE' })

  fetchWorkouts(currentPage.value)
}
</script>

<template>
  <div>
    <h1 class="text-2xl mb-6">Sesiones</h1>

    <div class="bg-gray-900 rounded-lg overflow-hidden">
      <div class="flex gap-2 mb-4 items-center">

        <input v-model="search" placeholder="Buscar sesión..." class="bg-gray-800 p-2 rounded flex-1" />

        <button @click="router.push('/workouts/create')" class="bg-green-500 px-4 py-2 rounded whitespace-nowrap">
          Crear sesión
        </button>

      </div>

      <table class="w-full text-left">
        <thead class="bg-gray-800 text-gray-400 text-sm">
          <tr>
            <th class="p-3">Nombre</th>
            <th class="p-3">Fecha</th>
            <th class="p-3 text-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="w in workouts" :key="w.id" class="border-t border-gray-800 hover:bg-gray-800">
            <td class="p-3">{{ w.name }}</td>
            <td class="p-3">{{ w.date }}</td>

            <td class="p-3 text-right flex gap-2 justify-end">
              <button @click="router.push(`/workouts/${w.id}/edit`)" class="text-blue-400 hover:text-blue-300">
                Editar
              </button>

              <button @click="router.push(`/display/${w.id}`)" class="text-green-400 hover:text-green-300">
                TV
              </button>

              <button @click="deleteWorkout(w.id)" class="text-red-400 hover:text-red-300">
                Borrar
              </button>
            </td>
          </tr>
        </tbody>

      </table>
      <div class="flex justify-center gap-2 mt-4">

        <button @click="fetchWorkouts(currentPage - 1)" :disabled="currentPage === 1"
          class="bg-gray-700 px-3 py-1 rounded disabled:opacity-50">
          ←
        </button>

        <span>
          Página {{ currentPage }} de {{ lastPage }}
        </span>

        <button @click="fetchWorkouts(currentPage + 1)" :disabled="currentPage === lastPage"
          class="bg-gray-700 px-3 py-1 rounded disabled:opacity-50">
          →
        </button>

      </div>

    </div>
  </div>
</template>