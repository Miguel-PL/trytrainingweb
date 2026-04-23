<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '../services/api'
import UiToast from '../components/ui/UiToast.vue'
import { useToast } from '../composables/useToast'

const email = ref('')
const password = ref('')
const router = useRouter()
const { toast, showToast, closeToast } = useToast()

const login = async () => {
  console.log('LOGIN CLICK')

  try {
    const data = await apiFetch('/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
      },
    })

    console.log('RESPONSE:', data)

    const token = data?.token || data?.access_token
    if (!token) throw new Error('Login OK pero falta token en la respuesta')
    localStorage.setItem('token', token)

    router.push('/workouts')

  } catch (error) {
    console.error('ERROR FETCH:', error)
    showToast('error', 'Error de login', error?.message || 'No se pudo iniciar sesión.')
  }
}
</script>

<template>
  <div class="relative min-h-screen bg-black text-white overflow-hidden">
    <UiToast
      :open="toast.open"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      @close="closeToast"
    />

    <!-- Fondo (vignette + grano sutil) -->
    <div
      class="pointer-events-none absolute inset-0 opacity-80"
      style="
        background:
          radial-gradient(80% 60% at 20% 30%, rgba(255, 255, 255, 0.08), transparent 55%),
          radial-gradient(70% 80% at 80% 40%, rgba(34, 197, 94, 0.10), transparent 60%),
          radial-gradient(120% 90% at 50% 110%, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 1));
      "
    />

    <div class="relative mx-auto flex min-h-screen w-full max-w-6xl items-stretch">
      <!-- Panel izquierdo -->
      <div class="flex w-full items-center px-6 py-12 sm:px-10 lg:w-[46%]">
        <div class="w-full max-w-md">
          <h1 class="text-4xl sm:text-5xl font-black tracking-tight italic">
            <span class="text-white/90">TRY</span><span class="text-lime-400">TRAINING</span>
          </h1>

          <p class="mt-4 text-sm text-white/60">
            Introduce tus datos de acceso.
          </p>

          <form @submit.prevent="login" class="mt-10 space-y-6">
            <div class="space-y-2">
              <label class="text-[11px] tracking-[0.22em] uppercase text-white/50">Email</label>
              <div class="group relative">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/45">
                  <!-- icon: mail -->
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="opacity-90">
                    <path
                      d="M4 7.5C4 6.11929 5.11929 5 6.5 5H17.5C18.8807 5 20 6.11929 20 7.5V16.5C20 17.8807 18.8807 19 17.5 19H6.5C5.11929 19 4 17.8807 4 16.5V7.5Z"
                      stroke="currentColor"
                      stroke-width="1.6"
                    />
                    <path
                      d="M6 8L12 12L18 8"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>

                <input
                  v-model="email"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  placeholder="hola@trytraining.com"
                  class="w-full rounded-md border border-white/10 bg-white/5 px-12 py-3 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/20"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[11px] tracking-[0.22em] uppercase text-white/50">Contraseña</label>
              <div class="group relative">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/45">
                  <!-- icon: lock -->
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="opacity-90">
                    <path
                      d="M7 10V8.2C7 5.8804 8.8804 4 11.2 4H12.8C15.1196 4 17 5.8804 17 8.2V10"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
                    <path
                      d="M7 10H17C18.1046 10 19 10.8954 19 12V18C19 19.1046 18.1046 20 17 20H7C5.89543 20 5 19.1046 5 18V12C5 10.8954 5.89543 10 7 10Z"
                      stroke="currentColor"
                      stroke-width="1.6"
                    />
                  </svg>
                </div>

                <input
                  v-model="password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full rounded-md border border-white/10 bg-white/5 px-12 py-3 text-sm text-white placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-lime-400/50 focus:ring-2 focus:ring-lime-400/20"
                />
              </div>
            </div>

            <button
              type="submit"
              class="group relative w-full overflow-hidden rounded-md bg-linear-to-r from-lime-300 to-lime-500 px-5 py-3 text-sm font-extrabold tracking-wide text-black shadow-[0_18px_35px_-20px_rgba(163,230,53,0.65)] transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-lime-300/40 active:translate-y-px"
            >
              <span class="relative inline-flex items-center justify-center gap-2">
                INICIAR SESIÓN
                <span class="translate-x-0 transition-transform group-hover:translate-x-0.5">→</span>
              </span>
              <span
                class="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style="background: radial-gradient(60% 90% at 30% 0%, rgba(255,255,255,0.35), transparent 60%);"
              />
            </button>
          </form>

          <p class="mt-10 text-xs text-white/35">
            © 2026 TRY TRAINING · TODOS LOS DERECHOS RESERVADOS
          </p>
        </div>
      </div>

      <!-- Panel derecho (hero) -->
      <div class="relative hidden flex-1 md:block">
        <div class="absolute inset-0">
          <!--
            Si añades una imagen en `public/login-hero.jpg`, se verá aquí automáticamente.
            Ruta sugerida: d:\proyectos\trytrainingweb\public\login-hero.jpg
          -->
          <div
            class="h-full w-full bg-cover bg-center opacity-80"
            style="background-image: url('/login-hero.jpg'); background-position: 70% 30%; filter: grayscale(1) contrast(1.08);"
          />
          <div class="absolute inset-0 bg-linear-to-l from-black via-black/40 to-transparent" />
          <div class="absolute inset-0" style="background: radial-gradient(60% 70% at 70% 40%, rgba(0,0,0,0.0), rgba(0,0,0,0.85));" />
        </div>
      </div>
    </div>
  </div>
</template>