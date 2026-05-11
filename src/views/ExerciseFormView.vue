<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch, apiUploadForm, unwrapExerciseResponse } from '../services/api'
import UiToast from '../components/ui/UiToast.vue'
import { useToast } from '../composables/useToast'
import { buildYouTubeEmbedUrl, validateExerciseMediaUrl } from '../utils/videoUrl'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const { toast, showToast, closeToast } = useToast()

const isEdit = computed(() => !!route.params.id)

const form = ref({
  name: '',
  video_url: '',
  categories: [],
})

const categories = ref([])

/** 'url' | 'file' */
const videoMode = ref('url')
const pendingFile = ref(null)
const previewObjectUrl = ref('')
const uploadProgress = ref(0)
const videoStatus = ref('ready')
const dragOver = ref(false)

let pollTimer = null
const POLL_MS = 2000
const POLL_MAX = 300

const isProcessingVideo = computed(() =>
  ['uploading', 'processing'].includes(videoStatus.value)
)

const videoStatusLabelEs = computed(() => {
  const s = String(videoStatus.value || 'ready').toLowerCase()
  const map = {
    ready: 'Listo',
    uploading: 'Subiendo',
    processing: 'Procesando',
    failed: 'Error',
    pending: 'Pendiente',
  }
  return map[s] || 'Sin clasificar'
})

/** Evita doble envío mientras el backend marca el vídeo como en cola de subida. */
const saveDisabled = computed(
  () => loading.value || videoStatus.value === 'uploading'
)

const revokePreview = () => {
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value)
    previewObjectUrl.value = ''
  }
}

const setPendingFile = (file) => {
  if (!file || !String(file.type || '').startsWith('video/')) {
    showToast('error', 'Archivo no válido', 'Selecciona un archivo de vídeo.')
    return
  }
  revokePreview()
  pendingFile.value = file
  previewObjectUrl.value = URL.createObjectURL(file)
  form.value.video_url = ''
  videoMode.value = 'file'
}

const clearPendingFile = () => {
  revokePreview()
  pendingFile.value = null
}

const clearPoll = () => {
  if (pollTimer != null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const applyExercisePayload = (data) => {
  form.value.name = data.name ?? ''
  form.value.video_url = data.video_url ?? ''
  form.value.categories = (data.categories || []).map((c) => c.id)
  videoStatus.value = data.video_status || 'ready'
}

/** GET /exercises/:id suele devolver `{ data: { id, name, ... } }` (Laravel). */
const applyExerciseFromApi = (raw) => {
  const row = unwrapExerciseResponse(raw) ?? raw
  applyExercisePayload(row)
}

const pollExerciseUntilVideoSettled = (id) => {
  clearPoll()
  let ticks = 0
  pollTimer = setInterval(async () => {
    ticks += 1
    if (ticks > POLL_MAX) {
      clearPoll()
      showToast('error', 'Tiempo agotado', 'El vídeo sigue procesándose. Recarga la página más tarde.')
      return
    }
    try {
      const raw = await apiFetch(`/exercises/${id}`)
      applyExerciseFromApi(raw)
      if (videoStatus.value === 'ready' || videoStatus.value === 'failed') {
        clearPoll()
        if (videoStatus.value === 'ready') {
          clearPendingFile()
          uploadProgress.value = 0
          showToast('success', 'Vídeo listo', 'La conversión ha terminado. Ya puedes reproducir el vídeo.')
        } else {
          showToast('error', 'Error en el vídeo', 'La conversión ha fallado. Prueba con otro archivo o formato.')
        }
      }
    } catch {
      // sigue intentando
    }
  }, POLL_MS)
}

const startPollIfNeeded = (id, status) => {
  if (['uploading', 'processing'].includes(status)) {
    pollExerciseUntilVideoSettled(id)
  }
}

watch(videoMode, (mode) => {
  if (mode === 'url') {
    clearPendingFile()
    uploadProgress.value = 0
  }
})

watch(
  () => route.params.id,
  async (id) => {
    if (!id) return
    clearPoll()
    try {
      const raw = await apiFetch(`/exercises/${id}`)
      applyExerciseFromApi(raw)
      startPollIfNeeded(String(id), videoStatus.value)
    } catch {
      /* ignore */
    }
  }
)

onMounted(async () => {
  categories.value = await apiFetch('/categories')

  if (isEdit.value) {
    const raw = await apiFetch(`/exercises/${route.params.id}`)
    applyExerciseFromApi(raw)
    startPollIfNeeded(String(route.params.id), videoStatus.value)
  }
})

onUnmounted(() => {
  clearPoll()
  revokePreview()
})

const fileInputRef = ref(null)

const openFilePicker = () => fileInputRef.value?.click()

const onFileInput = (e) => {
  const f = e.target.files?.[0]
  if (f) setPendingFile(f)
  e.target.value = ''
}

const onDrop = (e) => {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setPendingFile(f)
}

const buildMultipartBody = () => {
  const fd = new FormData()
  fd.append('name', form.value.name.trim())
  for (const id of form.value.categories) {
    fd.append('categories[]', String(id))
  }
  if (pendingFile.value) fd.append('video_file', pendingFile.value)
  return fd
}

const saveJson = async (body, method, endpoint) => {
  return apiFetch(endpoint, { method, body })
}

const navigateToList = (toastKey) => {
  router.push({
    path: '/exercises',
    query: { toast: toastKey },
  })
}

const save = async () => {
  try {
    if (!form.value.name.trim()) {
      showToast('error', 'Faltan datos', 'El nombre es obligatorio.')
      return
    }

    if (videoMode.value === 'url') {
      if (!form.value.video_url.trim()) {
        showToast('error', 'Faltan datos', 'Indica una URL de vídeo o cambia a “Subir archivo”.')
        return
      }
      const validation = validateExerciseMediaUrl(form.value.video_url)
      if (!validation.ok) {
        showToast('error', 'URL de vídeo inválida', validation.reason)
        return
      }
    } else if (!isEdit.value && !pendingFile.value) {
      showToast('error', 'Faltan datos', 'Selecciona un vídeo o usa una URL externa.')
      return
    }

    loading.value = true
    uploadProgress.value = 0
    let usedMultipart = false

    if (videoMode.value === 'file' && pendingFile.value) {
      usedMultipart = true
      const fd = buildMultipartBody()

      if (isEdit.value) {
        await apiUploadForm({
          endpoint: `/exercises/${route.params.id}`,
          method: 'PUT',
          formData: fd,
          onProgress: (p) => {
            uploadProgress.value = p
          },
        })
        const raw = await apiFetch(`/exercises/${route.params.id}`)
        applyExerciseFromApi(raw)
      } else {
        const created = await apiUploadForm({
          endpoint: '/exercises',
          method: 'POST',
          formData: fd,
          onProgress: (p) => {
            uploadProgress.value = p
          },
        })
        const payload = unwrapExerciseResponse(created) ?? created
        const id = payload?.id
        if (id == null) {
          console.warn('[exercises] POST respuesta inesperada:', created)
          throw new Error('Respuesta sin id de ejercicio (revisa envoltorio JSON o el cuerpo de la API).')
        }
        applyExercisePayload(payload)
      }

      uploadProgress.value = 0
      navigateToList(isEdit.value ? 'updated' : 'saved')
    } else {
      const body = {
        name: form.value.name.trim(),
        categories: form.value.categories,
      }
      if (videoMode.value === 'url' && form.value.video_url.trim()) {
        body.video_url = form.value.video_url.trim()
      }

      if (isEdit.value) {
        await saveJson(body, 'PUT', `/exercises/${route.params.id}`)
        const raw = await apiFetch(`/exercises/${route.params.id}`)
        applyExerciseFromApi(raw)
      } else {
        await saveJson(
          {
            ...body,
            video_url: form.value.video_url.trim(),
          },
          'POST',
          '/exercises'
        )
      }

      navigateToList(isEdit.value ? 'updated' : 'saved')
    }
  } catch (error) {
    console.error(error)
    showToast('error', 'Error', error?.message || 'Error al guardar.')
  } finally {
    loading.value = false
    uploadProgress.value = 0
  }
}

const goToList = () => {
  router.push({ path: '/exercises', query: { toast: 'saved' } })
}

const previewSrc = computed(() => {
  if (previewObjectUrl.value) return previewObjectUrl.value
  if (form.value.video_url?.trim()) return form.value.video_url.trim()
  return ''
})

const showYoutubePreview = computed(() => !!previewSrc.value && !!buildYouTubeEmbedUrl(previewSrc.value))

const showHtml5Preview = computed(() => {
  if (!previewSrc.value) return false
  return !buildYouTubeEmbedUrl(previewSrc.value)
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

    <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-4xl font-black tracking-tight">
          {{ isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio' }}
          <span class="ml-1 flex flex-col h-[3px] w-10 align-middle bg-lime-400" />
        </h1>
        <p class="mt-2 text-sm text-white/55">
          {{
            isEdit
              ? 'Actualiza el ejercicio. Puedes enlazar un vídeo externo o subir un archivo (se convertirá a MP4).'
              : 'Crea el ejercicio con URL o subiendo un vídeo desde tu equipo.'
          }}
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

              <!-- Origen vídeo -->
              <div class="space-y-3">
                <label class="text-[11px] tracking-[0.22em] uppercase text-white/50">Vídeo</label>
                <div class="inline-flex rounded-md border border-white/10 bg-black/30 p-0.5">
                  <button
                    type="button"
                    class="rounded px-4 py-2 text-xs font-extrabold tracking-wide transition"
                    :class="
                      videoMode === 'url'
                        ? 'bg-lime-400 text-black'
                        : 'text-white/60 hover:text-white/85'
                    "
                    @click="videoMode = 'url'"
                  >
                    URL externa
                  </button>
                  <button
                    type="button"
                    class="rounded px-4 py-2 text-xs font-extrabold tracking-wide transition"
                    :class="
                      videoMode === 'file'
                        ? 'bg-lime-400 text-black'
                        : 'text-white/60 hover:text-white/85'
                    "
                    @click="videoMode = 'file'"
                  >
                    Subir archivo
                  </button>
                </div>

                <template v-if="videoMode === 'url'">
                  <input
                    v-model="form.video_url"
                    placeholder="https://..."
                    class="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/15"
                  />
                  <p class="text-xs text-white/45">
                    YouTube (watch / shorts / youtu.be) o URL directa
                    <span class="font-semibold text-white/70">.mp4</span> /
                    <span class="font-semibold text-white/70">.mov</span> /
                    <span class="font-semibold text-white/70">.webm</span> /
                    <span class="font-semibold text-white/70">.ogg</span>.
                  </p>
                </template>

                <template v-else>
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="video/*"
                    class="hidden"
                    @change="onFileInput"
                  />
                  <div
                    class="relative rounded-lg border border-dashed px-4 py-8 text-center transition"
                    :class="
                      dragOver
                        ? 'border-lime-400/70 bg-lime-400/10'
                        : 'border-white/20 bg-white/[0.03]'
                    "
                    @dragenter.prevent="dragOver = true"
                    @dragover.prevent="dragOver = true"
                    @dragleave.prevent="dragOver = false"
                    @drop.prevent="onDrop"
                  >
                    <p class="text-sm font-semibold text-white/85">
                      Arrastra un vídeo aquí
                    </p>
                    <p class="mt-1 text-xs text-white/45">o</p>
                    <button
                      type="button"
                      class="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-xs font-extrabold tracking-wide text-white/90 transition hover:bg-white/10"
                      @click="openFilePicker"
                    >
                      Elegir del ordenador
                    </button>
                    <p v-if="pendingFile" class="mt-4 truncate text-xs text-lime-200/90">
                      {{ pendingFile.name }}
                      <button
                        type="button"
                        class="ml-2 text-white/50 underline hover:text-white/80"
                        @click="clearPendingFile"
                      >
                        Quitar
                      </button>
                    </p>
                  </div>
                  <p class="text-xs text-white/45">
                    Se sube al guardar. El servidor responde al terminar la subida y convierte a MP4 H.264 en segundo plano (puede tardar unos minutos).
                  </p>
                </template>

                <!-- Progreso subida -->
                <div
                  v-if="uploadProgress > 0 && uploadProgress < 100 && videoMode === 'file'"
                  class="space-y-1"
                >
                  <div class="flex justify-between text-[10px] uppercase tracking-wider text-white/50">
                    <span>Subiendo</span>
                    <span>{{ uploadProgress }}%</span>
                  </div>
                  <div class="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      class="h-full rounded-full bg-lime-400 transition-[width] duration-150"
                      :style="{ width: `${uploadProgress}%` }"
                    />
                  </div>
                </div>

                <!-- Estado conversión -->
                <div
                  v-if="isProcessingVideo"
                  class="flex items-center gap-3 rounded-lg border border-lime-400/25 bg-lime-400/10 px-4 py-3"
                >
                  <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-lime-300/30 border-t-lime-300" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-lime-100">
                      Convirtiendo vídeo en el servidor…
                    </p>
                    <p class="text-xs text-white/55">
                      Estado: <span class="text-white/80">{{ videoStatusLabelEs }}</span>
                      — Puedes seguir en esta página; se actualizará la vista previa al terminar.
                    </p>
                  </div>
                </div>

                <div
                  v-if="videoStatus === 'failed'"
                  class="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  La conversión del vídeo ha fallado. Sube otro archivo o usa una URL.
                </div>
              </div>

              <!-- Preview -->
              <div v-if="previewSrc && (showYoutubePreview || showHtml5Preview)" class="space-y-2">
                <div class="text-[11px] tracking-[0.22em] uppercase text-white/50">
                  Vista previa
                </div>
                <div class="overflow-hidden rounded-lg border border-white/10 bg-black/40">
                  <iframe
                    v-if="showYoutubePreview"
                    :src="buildYouTubeEmbedUrl(previewSrc)"
                    class="h-52 w-full"
                    frameborder="0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowfullscreen
                  />
                  <video
                    v-else-if="showHtml5Preview"
                    :src="previewSrc"
                    controls
                    playsinline
                    class="h-52 w-full object-cover"
                  />
                </div>
              </div>

              <div
                v-else-if="videoMode === 'file' && !previewSrc && !isProcessingVideo"
                class="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40"
              >
                Selecciona un vídeo para ver la vista previa.
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
                    v-model="form.categories"
                    type="checkbox"
                    :value="c.id"
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
            class="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/8"
            @click="router.push('/exercises')"
          >
            Cancelar
          </button>

          <button
            v-if="isProcessingVideo"
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/8"
            @click="goToList"
          >
            Ir al listado
          </button>

          <button
            type="button"
            :disabled="saveDisabled"
            class="inline-flex h-10 items-center justify-center rounded-md border border-lime-300/20 bg-lime-400 px-5 text-sm font-extrabold tracking-wide text-black shadow-[0_20px_45px_-30px_rgba(163,230,53,0.75)] transition hover:bg-lime-300 disabled:opacity-50"
            @click="save"
          >
            {{
              loading
                ? videoMode === 'file' && pendingFile
                  ? 'Subiendo…'
                  : 'Guardando…'
                : 'Guardar'
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
