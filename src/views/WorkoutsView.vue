<script setup>
import { onMounted, ref, watch } from 'vue'
import { apiFetch } from '../services/api'
import { useRoute, useRouter } from 'vue-router'
import UiToast from '../components/ui/UiToast.vue'
import UiConfirmModal from '../components/ui/UiConfirmModal.vue'
import UiSpinner from '../components/ui/UiSpinner.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const { toast, showToast, closeToast } = useToast()

const confirmDelete = ref({ open: false, id: null, name: '', loading: false })

const workouts = ref([])
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const loadingInitial = ref(true)

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

const deleteWorkout = async (id) => {
  confirmDelete.value = {
    open: true,
    id,
    name: workouts.value?.find(w => w.id === id)?.name || '',
    loading: false,
  }
}

const performDeleteWorkout = async () => {
  if (!confirmDelete.value.id) return
  confirmDelete.value.loading = true
  try {
    await apiFetch(`/workouts/${confirmDelete.value.id}`, { method: 'DELETE' })
    confirmDelete.value.open = false
    showToast('success', 'Eliminado', 'Sesión borrada con éxito.')
    fetchWorkouts(currentPage.value)
  } catch (e) {
    showToast('error', 'Error', e?.message || 'No se pudo borrar la sesión.')
  } finally {
    confirmDelete.value.loading = false
  }
}

watch(search, () => {
  fetchWorkouts(1)
})

onMounted(async () => {
  loadingInitial.value = true
  try {
    await fetchWorkouts()

    const t = String(route.query?.toast || '')
    if (t === 'saved') showToast('success', 'Guardado', 'Sesión guardada con éxito.')
    if (t === 'updated') showToast('success', 'Actualizado', 'Sesión actualizada con éxito.')
    if (t === 'deleted') showToast('success', 'Eliminado', 'Sesión borrada con éxito.')
  } catch (e) {
    showToast('error', 'Error', e?.message || 'No se pudieron cargar las sesiones.')
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
      title="Eliminar sesión"
      :message="`Vas a eliminar ${confirmDelete.name || 'esta sesión'}. Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :loading="confirmDelete.loading"
      tone="danger"
      @confirm="performDeleteWorkout"
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
          Sesiones
          <span class="ml-1 flex flex-col h-[3px] w-10 align-middle bg-lime-400" />
        </h1>
        <p class="mt-2 text-sm text-white/55">Administración de sesiones</p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          @click="router.push('/workouts/create')"
          class="inline-flex items-center justify-center gap-2 rounded-md border border-lime-300/20 bg-lime-400 px-4 py-2 text-xs font-extrabold tracking-wide text-black shadow-[0_20px_45px_-30px_rgba(163,230,53,0.75)] transition hover:bg-lime-300"
        >
          <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </span>
          NUEVA SESIÓN
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
    </div>

    <!-- Tabla -->
    <div class="mt-6 rounded-xl border border-white/10 bg-white/4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.8)]">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left">
          <thead class="text-[11px] tracking-[0.22em] uppercase text-white/45">
            <tr class="border-b border-white/10">
              <th class="w-20 whitespace-nowrap px-6 py-4">ID</th>
              <th class="px-6 py-4">Workout details</th>
              <th class="px-6 py-4">Fecha</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody class="text-sm">
            <tr
              v-for="w in workouts"
              :key="w.id"
              class="border-b border-white/8 last:border-b-0 hover:bg-white/3"
            >
              <td class="px-6 py-5 font-mono text-sm tabular-nums text-white/60">
                {{ w.id }}
              </td>

              <td class="px-6 py-5 font-semibold text-white/90">
                {{ w.name }}
              </td>

              <td class="px-6 py-5 text-white/70">
                {{ w.date }}
              </td>

              <td class="px-6 py-5">
                <div class="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    @click="router.push(`/workouts/${w.id}/edit`)"
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

                  <router-link
                    :to="`/display/${w.id}`"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/8"
                    aria-label="TV (abrir en nueva pestaña)"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7h16v10H4V7Z"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linejoin="round"
                      />
                      <path d="M9 21h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                      <path d="M12 17v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                    </svg>
                  </router-link>

                  <button
                    type="button"
                    @click="deleteWorkout(w.id)"
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
      <div class="flex flex-col gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-xs text-white/45">
          Página {{ currentPage }} de {{ lastPage }}
        </div>

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            @click="fetchWorkouts(currentPage - 1)"
            :disabled="currentPage === 1"
            class="inline-flex h-9 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white/70 transition disabled:opacity-40 hover:bg-white/8"
          >
            Atrás
          </button>

          <button
            type="button"
            @click="fetchWorkouts(currentPage + 1)"
            :disabled="currentPage === lastPage"
            class="inline-flex h-9 items-center justify-center rounded-md border border-lime-300/20 bg-lime-400 px-4 text-sm font-semibold text-black shadow-[0_20px_45px_-30px_rgba(163,230,53,0.75)] transition disabled:opacity-40 hover:bg-lime-300"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>