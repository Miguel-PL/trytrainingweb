<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../services/api'

const categories = ref([])
const newCategory = ref('')
const editingId = ref(null)
const editingName = ref('')

const createCategory = async () => {
  if (!newCategory.value.trim()) return

  const cat = await apiFetch('/categories', {
    method: 'POST',
    body: { name: newCategory.value }
  })

  categories.value.push(cat)
  newCategory.value = ''
}

const startEdit = (cat) => {
  editingId.value = cat.id
  editingName.value = cat.name
}

const updateCategory = async (cat) => {
  const updated = await apiFetch(`/categories/${cat.id}`, {
    method: 'PUT',
    body: { name: editingName.value }
  })

  cat.name = updated.name
  editingId.value = null
}

const deleteCategory = async (id) => {
  const ok = confirm('¿Eliminar categoría?')
  if (!ok) return

  await apiFetch(`/categories/${id}`, { method: 'DELETE' })

  categories.value = categories.value.filter(c => c.id !== id)
}

onMounted(async () => {
  categories.value = await apiFetch('/categories')
})
</script>

<template>
  <div class="p-6 text-white max-w-xl">

    <h1 class="text-2xl mb-4">Categorías</h1>

    <!-- CREAR -->
    <div class="flex gap-2 mb-4">
      <input v-model="newCategory" placeholder="Nueva categoría" class="bg-gray-800 p-2 rounded w-full" />
      <button @click="createCategory" class="bg-green-500 px-3 rounded">
        Crear
      </button>
    </div>

    <!-- LISTADO -->
    <div v-for="cat in categories" :key="cat.id" class="flex justify-between items-center mb-2 bg-gray-800 p-2 rounded">

      <div v-if="editingId !== cat.id">
        {{ cat.name }}
      </div>

      <input v-else v-model="editingName" class="bg-gray-700 p-1 rounded" />

      <div class="flex gap-2">

        <button v-if="editingId !== cat.id" @click="startEdit(cat)" class="text-blue-400">
          Editar
        </button>

        <button v-else @click="updateCategory(cat)" class="text-green-400">
          Guardar
        </button>

        <button @click="deleteCategory(cat.id)" class="text-red-400">
          Eliminar
        </button>

      </div>

    </div>

  </div>
</template>