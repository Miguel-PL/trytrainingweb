<script setup>
import { onMounted, ref } from 'vue'
import { apiFetch } from '../services/api'
import { useRouter } from 'vue-router'


const router = useRouter()

const workouts = ref([])

onMounted(async () => {
  try {
    const data = await apiFetch('/workouts')
    workouts.value = data.data || data
  } catch (error) {
    console.error(error)
  }
})

const deleteWorkout = async (id) => {
  const confirmacion = confirm('¿Seguro que quieres borrar esta sesión?')

  if (!confirmacion) return

  try {
    await apiFetch(`/workouts/${id}`, {
      method: 'DELETE'
    })

    // refrescar lista
    workouts.value = workouts.value.filter(w => w.id !== id)

  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl mb-6">Sesiones</h1>

    <div class="bg-gray-900 rounded-lg overflow-hidden">

      <table class="w-full text-left">
        <thead class="bg-gray-800 text-gray-400 text-sm">
          <tr>
            <th class="p-3">Nombre</th>
            <th class="p-3">Fecha</th>
            <th class="p-3 text-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="w in workouts"
            :key="w.id"
            class="border-t border-gray-800 hover:bg-gray-800"
          >
            <td class="p-3">{{ w.name }}</td>
            <td class="p-3">{{ w.date }}</td>

            <td class="p-3 text-right flex gap-2 justify-end">
              <button
                  @click="router.push(`/workouts/${w.id}/edit`)"
                  class="text-blue-400 hover:text-blue-300"
                >
                  Editar
              </button>

              <button
                @click="router.push(`/display/${w.id}`)"
                class="text-green-400 hover:text-green-300">
                TV
              </button>

              <button
                  @click="deleteWorkout(w.id)"
                  class="text-red-400 hover:text-red-300"
                >
                  Borrar
              </button>
            </td>
          </tr>
        </tbody>

      </table>

    </div>
  </div>
</template>