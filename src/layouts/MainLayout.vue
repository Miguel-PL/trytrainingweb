<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)

const logout = () => {
  localStorage.removeItem('token')
  router.push('/')
}

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  }
)
</script>

<template>
  <div class="min-h-screen bg-black text-white" :class="sidebarOpen ? 'overflow-hidden' : ''">
    <div class="flex min-h-screen">
      <!-- Sidebar -->
      <!-- Mobile overlay -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        @click="sidebarOpen = false"
      />

      <aside
        class="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/10 bg-black/80 backdrop-blur transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:bg-black/60"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="flex h-full flex-col px-5 py-6">
          <!-- Mobile header inside drawer -->
          <div class="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <div class="flex flex-1 justify-center">
              <img
                src="/logo_white.png"
                alt="TryTraining"
                class="h-12 w-auto object-contain"
                draggable="false"
              />
            </div>
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/8"
              aria-label="Cerrar menú"
              @click="sidebarOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="mb-6 hidden justify-center lg:flex">
            <img
              src="/logo_white.png"
              alt="TryTraining"
              class="h-12 w-auto object-contain"
              draggable="false"
            />
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
        <!-- Mobile topbar -->
        <div class="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 hover:bg-white/8"
            aria-label="Abrir menú"
            @click="sidebarOpen = true"
          >
            ☰
          </button>
          <div class="min-w-0">
            <div class="truncate text-xs font-extrabold tracking-[0.18em] text-white/80">
              TRY TRAINING
            </div>
          </div>
        </div>
        <router-view />
      </main>
    </div>
  </div>
</template>