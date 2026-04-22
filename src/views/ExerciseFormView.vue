<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../services/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)

const isEdit = !!route.params.id

const form = ref({
    name: '',
    video_url: '',
    categories: []
})

const categories = ref([])

onMounted(async () => {
    categories.value = await apiFetch('/categories')

    if (isEdit) {
        const data = await apiFetch(`/exercises/${route.params.id}`)

        form.value = {
            name: data.name,
            video_url: data.video_url,
            categories: data.categories.map(c => c.id)
        }
    }
})

const save = async () => {
    try {
        loading.value = true

        const payload = form.value

        if (!form.value.name.trim()) {
            loading.value = false
            alert('El nombre es obligatorio')
            return
        }

        if (!form.value.video_url.trim()) {
            loading.value = false
            alert('La URL del vídeo es obligatoria')
            return
        }

        if (isEdit) {
            await apiFetch(`/exercises/${route.params.id}`, {
                method: 'PUT',
                body: payload
            })
        } else {
            await apiFetch('/exercises', {
                method: 'POST',
                body: payload
            })
        }

        router.push('/exercises')

    } catch (error) {
        console.error(error)
        alert('Error al guardar')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="p-6 text-white max-w-xl mx-auto">

        <h1 class="text-2xl mb-4">
            {{ isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio' }}
        </h1>

        <p class="mb-1">Nombre del ejercicio</p>
        <input v-model="form.name" placeholder="Nombre" class="bg-gray-800 p-2 rounded w-full mb-2" />

        <p class="mb-1">Archivo de vídeo o URL</p>
        <input v-model="form.video_url" placeholder="URL del video" class="bg-gray-800 p-2 rounded w-full mb-2" />
        <video v-if="form.video_url" :src="form.video_url" controls class="w-full h-48 object-cover rounded mt-2" />

        <div class="mb-4">
            <p class="mb-1">Categorías</p>

            <label v-for="c in categories" :key="c.id" class="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded">
                <input type="checkbox" :value="c.id" v-model="form.categories" />
                {{ c.name }}
            </label>
        </div>

        <div class="flex gap-2">
            <button @click="save" :disabled="loading" class="bg-green-500 px-4 py-2 rounded">
                {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>

            <button @click="router.push('/exercises')" class="bg-gray-600 px-4 py-2 rounded">
                Cancelar
            </button>
        </div>

    </div>
</template>