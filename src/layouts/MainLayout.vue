<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  localStorage.removeItem('token')
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-black text-white">
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <aside class="w-[280px] border-r border-white/10 bg-black/60 backdrop-blur">
        <div class="flex h-full flex-col px-5 py-6">
          <div class="mb-6">
            <div class="text-sm font-black tracking-[0.2em] text-lime-300">
              TRY TRAINING
            </div>
            <div class="mt-1 text-[10px] tracking-[0.28em] uppercase text-white/40">
              Elite management
            </div>
          </div>

          <nav class="flex flex-col gap-2">
            <router-link
              to="/workouts"
              class="group flex items-center gap-3 rounded-md border border-transparent px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
              active-class="bg-white/5 text-white border-white/10"
            >
              <span class="inline-flex h-8 w-8 items-center justify-center rounded bg-white/5 text-lime-300/90">
                <img
                  src="/Mancuerna.svg"
                  alt=""
                  class="h-[18px] w-[18px] opacity-80 filter-[invert(1)]"
                />
              </span>
              Sesiones
            </router-link>

            <router-link
              to="/exercises"
              class="group flex items-center gap-3 rounded-md border border-transparent px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
              active-class="bg-white/5 text-white border-white/10"
            >
              <span class="inline-flex h-8 w-8 items-center justify-center rounded bg-white/5 text-white/70">
                <img
                  src="/biceps.svg"
                  alt=""
                  class="h-[18px] w-[18px] opacity-80 filter-[invert(1)]"
                />
              </span>
              Ejercicios
            </router-link>

            <router-link
              to="/categories"
              class="group flex items-center gap-3 rounded-md border border-transparent px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
              active-class="bg-white/5 text-white border-white/10"
            >
              <span class="inline-flex h-8 w-8 items-center justify-center rounded bg-white/5 text-white/70">
                <img
                  src="/tag.svg"
                  alt=""
                  class="h-[18px] w-[18px] opacity-80 filter-[invert(1)]"
                />
              </span>
              Categorías
            </router-link>
          </nav>

          <div class="mt-auto pt-6">
            <button
              type="button"
              @click="logout"
              class="flex w-full items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/8 hover:text-white"
            >
              <span class="inline-flex h-8 w-8 items-center justify-center rounded bg-white/5 text-white/70">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M10 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                  <path d="M13 12H3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <path d="m6 9-3 3 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <!-- Contenido -->
      <main class="min-w-0 flex-1">
        <router-view />
      </main>
    </div>
  </div>
</template>