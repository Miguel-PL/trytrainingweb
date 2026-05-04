<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiFetch } from '../services/api'
import { useRoute, useRouter } from 'vue-router'
import { watch } from 'vue'
import UiToast from '../components/ui/UiToast.vue'
import UiConfirmModal from '../components/ui/UiConfirmModal.vue'
import UiSpinner from '../components/ui/UiSpinner.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()

const exercises = ref([])
const categories = ref([])
const totalExercises = ref(null)
const loadingInitial = ref(true)

const { toast, showToast, closeToast } = useToast()

const confirmDelete = ref({
  open: false,
  id: null,
  name: '',
  loading: false,
})

const currentPage = ref(1)
const lastPage = ref(1)

const fetchExercises = async (page = 1) => {
  let url = `/exercises?page=${page}`

  if (search.value) {
    url += `&name=${search.value}`
  }

  if (selectedCategory.value && selectedCategory.value !== '__none__') {
    url += `&category_id=${selectedCategory.value}`
  }

  const response = await apiFetch(url)

  exercises.value = response.data
  currentPage.value = response.current_page
  lastPage.value = response.last_page
  totalExercises.value = response.total ?? response.meta?.total ?? null
}

const requestDeleteExercise = (ex) => {
  confirmDelete.value = {
    open: true,
    id: ex.id,
    name: ex?.name || '',
    loading: false,
  }
}

const performDeleteExercise = async () => {
  if (!confirmDelete.value.id) return
  confirmDelete.value.loading = true
  try {
    await apiFetch(`/exercises/${confirmDelete.value.id}`, { method: 'DELETE' })
    exercises.value = (exercises.value || []).filter(e => e.id !== confirmDelete.value.id)
    confirmDelete.value.open = false
    showToast('success', 'Eliminado', 'Ejercicio borrado con éxito.')
  } catch (e) {
    showToast('error', 'Error', e?.message || 'No se pudo borrar el ejercicio.')
  } finally {
    confirmDelete.value.loading = false
  }
}

const search = ref('')
const selectedCategory = ref('')

const filteredExercises = computed(() => {
  const selected = selectedCategory.value

  if (!selected) return exercises.value || []

  // Special value to filter exercises with no categories assigned
  if (selected === '__none__') {
    return (exercises.value || []).filter(ex => !(ex?.categories?.length > 0))
  }

  return (exercises.value || []).filter(ex =>
    (ex?.categories || []).some(c => String(c.id) === String(selected))
  )
})

const sortedExercises = computed(() => {
  return [...filteredExercises.value].sort((a, b) =>
    (a?.name || '').localeCompare((b?.name || ''), 'es', { sensitivity: 'base' })
  )
})

const displayedTotal = computed(() => {
  if (selectedCategory.value === '__none__') return filteredExercises.value.length
  return totalExercises.value ?? exercises.value.length
})

watch([search, selectedCategory], () => {
  fetchExercises(1)
})

onMounted(async () => {
  loadingInitial.value = true
  try {
    await fetchExercises()
    categories.value = await apiFetch('/categories')

    const t = String(route.query?.toast || '')
    if (t === 'saved') showToast('success', 'Guardado', 'Ejercicio guardado con éxito.')
    if (t === 'updated') showToast('success', 'Actualizado', 'Ejercicio actualizado con éxito.')
    if (t === 'deleted') showToast('success', 'Eliminado', 'Ejercicio borrado con éxito.')
  } catch (e) {
    showToast('error', 'Error', e?.message || 'No se pudieron cargar los ejercicios.')
  } finally {
    loadingInitial.value = false
  }
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
      :open="confirmDelete.open"
      title="Eliminar ejercicio"
      :message="`Vas a eliminar ${confirmDelete.name || 'este ejercicio'}. Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :loading="confirmDelete.loading"
      tone="danger"
      @confirm="performDeleteExercise"
      @cancel="confirmDelete.open = false"
    />

    <!-- Spinner de carga inicial -->
    <div v-if="loadingInitial" class="flex h-screen items-center justify-center">
      <UiSpinner size="lg" class="text-lime-400" />
    </div>

    <!-- Contenido -->
    <template v-else>

    <!-- Cabecera -->
    <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-4xl font-black tracking-tight">
          Ejercicios
          <span class="ml-1 flex flex-col h-[3px] w-10 align-middle bg-lime-400" />
        </h1>
        <p class="mt-2 text-sm text-white/55">Administración de ejercicios</p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          @click="router.push('/exercises/create')"
          class="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-extrabold tracking-wide text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/8"
        >
          <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-lime-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </span>
          NUEVO EJERCICIO
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="relative w-full max-w-xl">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/40">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" stroke-width="1.6" />
            <path d="M16.5 16.5 21 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </div>

        <input
          v-model="search"
          placeholder="Buscar..."
          class="w-full rounded-md border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
        />
      </div>

      <div class="flex flex-col items-end gap-2">
        <div class="relative w-full min-w-[220px] sm:w-[240px]">
          <select
            v-model="selectedCategory"
            class="w-full appearance-none rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15 scheme-dark"
          >
            <option value="">Todas las categorías</option>
            <option value="__none__">Sin categorías</option>
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

        <div class="text-[11px] tracking-[0.22em] uppercase text-white/45">
          {{ displayedTotal }} ejercicios
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="mt-6 rounded-xl border border-white/10 bg-white/4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.8)]">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left">
          <thead class="text-[11px] tracking-[0.22em] uppercase text-white/45">
            <tr class="border-b border-white/10">
              <th class="px-6 py-4">Nombre</th>
              <th class="px-6 py-4">Categorías</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody class="text-sm">
            <tr
              v-for="ex in sortedExercises"
              :key="ex.id"
              class="border-b border-white/8 last:border-b-0 hover:bg-white/3"
            >
              <td class="px-6 py-5 font-semibold text-white/90">
                {{ ex.name }}
              </td>

              <td class="px-6 py-5">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(c, idx) in (ex.categories || [])"
                    :key="c.id"
                    class="inline-flex items-center rounded border px-2 py-1 text-[10px] font-extrabold tracking-wide"
                    :class="idx % 2 === 0
                      ? 'border-white/10 bg-white/5 text-white/80'
                      : 'border-lime-300/25 bg-lime-400/15 text-lime-200'"
                  >
                    {{ c.name }}
                  </span>
                </div>
              </td>

              <td class="px-6 py-5">
                <div class="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    @click="router.push(`/exercises/${ex.id}/edit`)"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/8"
                    aria-label="Editar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L16.5 4.5a2.1 2.1 0 0 0-3 0L3 15v5Z"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linejoin="round"
                      />
                      <path d="M13.5 5.5 18.5 10.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    @click="requestDeleteExercise(ex)"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/8"
                    aria-label="Eliminar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M6 7h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                      <path d="M10 7V5h4v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                      <path d="M8 7l1 14h6l1-14" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="flex items-center justify-center gap-3 border-t border-white/10 px-6 py-4 text-sm text-white/70">
        <button
          @click="fetchExercises(currentPage - 1)"
          :disabled="currentPage === 1"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 transition disabled:opacity-40 hover:bg-white/8"
          aria-label="Anterior"
        >
          ←
        </button>

        <span> Página {{ currentPage }} de {{ lastPage }} </span>

        <button
          @click="fetchExercises(currentPage + 1)"
          :disabled="currentPage === lastPage"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 transition disabled:opacity-40 hover:bg-white/8"
          aria-label="Siguiente"
        >
          →
        </button>
      </div>
    </div>
    </template>
  </div>
</template>

<style scoped>
select {
  color-scheme: dark;
}

select option,
select optgroup {
  background-color: #0b0b0b;
  color: rgba(255, 255, 255, 0.9);
}
</style>