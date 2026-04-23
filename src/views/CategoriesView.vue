<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../services/api'
import UiToast from '../components/ui/UiToast.vue'
import UiConfirmModal from '../components/ui/UiConfirmModal.vue'
import { useToast } from '../composables/useToast'

const categories = ref([])
const newCategory = ref('')
const editingId = ref(null)
const editingName = ref('')
const { toast, showToast, closeToast } = useToast()

const confirmDelete = ref({ open: false, id: null, name: '', loading: false })

const createCategory = async () => {
  if (!newCategory.value.trim()) return

  try {
    const cat = await apiFetch('/categories', {
      method: 'POST',
      body: { name: newCategory.value }
    })

    categories.value.push(cat)
    newCategory.value = ''
    showToast('success', 'Guardado', 'Categoría creada con éxito.')
  } catch (e) {
    showToast('error', 'Error', e?.message || 'No se pudo crear la categoría.')
  }
}

const startEdit = (cat) => {
  editingId.value = cat.id
  editingName.value = cat.name
}

const updateCategory = async (cat) => {
  try {
    const updated = await apiFetch(`/categories/${cat.id}`, {
      method: 'PUT',
      body: { name: editingName.value }
    })

    cat.name = updated.name
    editingId.value = null
    showToast('success', 'Actualizado', 'Categoría actualizada con éxito.')
  } catch (e) {
    showToast('error', 'Error', e?.message || 'No se pudo actualizar la categoría.')
  }
}

const requestDeleteCategory = (cat) => {
  confirmDelete.value = { open: true, id: cat.id, name: cat?.name || '', loading: false }
}

const performDeleteCategory = async () => {
  if (!confirmDelete.value.id) return
  confirmDelete.value.loading = true
  try {
    await apiFetch(`/categories/${confirmDelete.value.id}`, { method: 'DELETE' })
    categories.value = categories.value.filter(c => c.id !== confirmDelete.value.id)
    confirmDelete.value.open = false
    showToast('success', 'Eliminado', 'Categoría borrada con éxito.')
  } catch (e) {
    showToast('error', 'Error', e?.message || 'No se pudo borrar la categoría.')
  } finally {
    confirmDelete.value.loading = false
  }
}

onMounted(async () => {
  categories.value = await apiFetch('/categories')
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
      title="Eliminar categoría"
      :message="`Vas a eliminar ${confirmDelete.name || 'esta categoría'}. Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      :loading="confirmDelete.loading"
      tone="danger"
      @confirm="performDeleteCategory"
      @cancel="confirmDelete.open = false"
    />

    <!-- Cabecera -->
    <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-4xl font-black tracking-tight">
          Categorías
          <span class="ml-1 flex flex-col h-[3px] w-10 align-middle bg-lime-400" />
        </h1>
        <p class="mt-2 text-sm text-white/55">Administración de categorías</p>
      </div>
    </div>

    <div class="mt-8 max-w-3xl">
      <!-- Crear -->
      <div class="rounded-xl border border-white/10 bg-white/4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.8)]">
        <div class="border-b border-white/10 px-6 py-5">
          <div class="text-[11px] tracking-[0.22em] uppercase text-white/45">
            Nueva categoría
          </div>

          <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative w-full">
              <input
                v-model="newCategory"
                placeholder="Nombre de la categoría"
                class="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
              />
            </div>

            <button
              type="button"
              @click="createCategory"
              class="inline-flex h-11 items-center justify-center rounded-md border border-lime-300/20 bg-lime-400 px-5 text-xs font-extrabold tracking-wide text-black shadow-[0_20px_45px_-30px_rgba(163,230,53,0.75)] transition hover:bg-lime-300"
            >
              CREAR
            </button>
          </div>
        </div>

        <!-- Listado -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-left">
            <thead class="text-[11px] tracking-[0.22em] uppercase text-white/45">
              <tr class="border-b border-white/10">
                <th class="px-6 py-4">Nombre</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody class="text-sm">
              <tr
                v-for="cat in categories"
                :key="cat.id"
                class="border-b border-white/8 last:border-b-0 hover:bg-white/3"
              >
                <td class="px-6 py-5 font-semibold text-white/90">
                  <div v-if="editingId !== cat.id">
                    {{ cat.name }}
                  </div>

                  <input
                    v-else
                    v-model="editingName"
                    class="w-full max-w-sm rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
                  />
                </td>

                <td class="px-6 py-5">
                  <div class="flex items-center justify-end gap-3">
                    <button
                      v-if="editingId !== cat.id"
                      type="button"
                      @click="startEdit(cat)"
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
                      v-else
                      type="button"
                      @click="updateCategory(cat)"
                      class="inline-flex h-9 items-center justify-center rounded-md border border-lime-300/20 bg-lime-400 px-4 text-xs font-extrabold tracking-wide text-black shadow-[0_20px_45px_-30px_rgba(163,230,53,0.75)] transition hover:bg-lime-300"
                    >
                      GUARDAR
                    </button>

                    <button
                      type="button"
                      @click="requestDeleteCategory(cat)"
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

              <tr v-if="!categories.length">
                <td class="px-6 py-10 text-sm text-white/55" colspan="2">
                  No hay categorías todavía.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>