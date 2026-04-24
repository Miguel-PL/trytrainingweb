<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../services/api'
import UiToast from '../components/ui/UiToast.vue'
import { useToast } from '../composables/useToast'
import { buildYouTubeEmbedUrl, validateExerciseMediaUrl } from '../utils/videoUrl'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const { toast, showToast, closeToast } = useToast()

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
            showToast('error', 'Faltan datos', 'El nombre es obligatorio.')
            return
        }

        if (!form.value.video_url.trim()) {
            loading.value = false
            showToast('error', 'Faltan datos', 'La URL del vídeo es obligatoria.')
            return
        }

        const validation = validateExerciseMediaUrl(form.value.video_url)
        if (!validation.ok) {
          loading.value = false
          showToast('error', 'URL de vídeo inválida', validation.reason)
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

        router.push({
          path: '/exercises',
          query: { toast: isEdit ? 'updated' : 'saved' },
        })

    } catch (error) {
        console.error(error)
        showToast('error', 'Error', error?.message || 'Error al guardar.')
    } finally {
        loading.value = false
    }
}
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

    <!-- Cabecera -->
    <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-4xl font-black tracking-tight">
          {{ isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio' }}
          <span class="ml-1 flex flex-col h-[3px] w-10 align-middle bg-lime-400" />
        </h1>
        <p class="mt-2 text-sm text-white/55">
          {{ isEdit ? 'Actualiza la información del ejercicio.' : 'Crea un nuevo ejercicio y asígnale categorías.' }}
        </p>
      </div>
    </div>

    <div class="mt-8 mx-auto w-full max-w-3xl">
      <div class="rounded-xl border border-white/10 bg-white/4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.8)]">
        <div class="px-6 py-6">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="space-y-5">
              <div class="space-y-2">
                <label class="text-[11px] tracking-[0.22em] uppercase text-white/50">Nombre</label>
                <input
                  v-model="form.name"
                  placeholder="Ej: Press banca"
                  class="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
                />
              </div>

              <div class="space-y-2">
                <label class="text-[11px] tracking-[0.22em] uppercase text-white/50">Vídeo (URL)</label>
                <input
                  v-model="form.video_url"
                  placeholder="https://..."
                  class="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
                />
                <div class="text-xs text-white/45">
                  Acepta <span class="font-semibold text-white/70">YouTube</span> (watch/shorts/youtu.be) o un enlace directo a <span class="font-semibold text-white/70">.mp4</span>/<span class="font-semibold text-white/70">.webm</span>/<span class="font-semibold text-white/70">.ogg</span>.
                  En TV debe ser accesible sin login.
                </div>
              </div>

              <div v-if="form.video_url" class="space-y-2">
                <div class="text-[11px] tracking-[0.22em] uppercase text-white/50">Preview</div>
                <div class="overflow-hidden rounded-lg border border-white/10 bg-black/40">
                  <iframe
                    v-if="buildYouTubeEmbedUrl(form.video_url)"
                    :src="buildYouTubeEmbedUrl(form.video_url)"
                    class="w-full h-52"
                    frameborder="0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowfullscreen
                  />
                  <video v-else :src="form.video_url" controls class="w-full h-52 object-cover" />
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex items-end justify-between">
                <div class="text-[11px] tracking-[0.22em] uppercase text-white/50">Categorías</div>
                <div class="text-xs text-white/45">
                  {{ form.categories.length }} seleccionadas
                </div>
              </div>

              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label
                  v-for="c in categories"
                  :key="c.id"
                  class="flex cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/80 transition hover:bg-white/8"
                >
                  <input
                    type="checkbox"
                    :value="c.id"
                    v-model="form.categories"
                    class="h-4 w-4 rounded border-white/20 bg-black/30 text-lime-400 focus:ring-lime-400/30"
                  />
                  <span class="font-semibold">{{ c.name }}</span>
                </label>

                <div
                  v-if="!categories.length"
                  class="rounded-md border border-white/10 bg-white/3 px-3 py-6 text-sm text-white/55 sm:col-span-2"
                >
                  No hay categorías disponibles.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 border-t border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            @click="router.push('/exercises')"
            class="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/8"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="save"
            :disabled="loading"
            class="inline-flex h-10 items-center justify-center rounded-md border border-lime-300/20 bg-lime-400 px-5 text-sm font-extrabold tracking-wide text-black shadow-[0_20px_45px_-30px_rgba(163,230,53,0.75)] transition hover:bg-lime-300 disabled:opacity-50"
          >
            {{ loading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>