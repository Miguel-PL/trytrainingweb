<template>
  <div class="flex min-h-screen bg-black text-white">

    <!-- Sidebar -->
    <aside class="w-64 bg-gray-900 p-4">
      <h2 class="text-yellow-300 text-xl font-bold mb-6">
        TRY TRAINING
      </h2>

      <nav class="flex flex-col gap-3">
        <router-link to="/workouts" class="hover:text-green-400">
          Sesiones
        </router-link>

        <router-link to="/exercises" class="hover:text-green-400">
          Ejercicios
        </router-link>

        <router-link to="/categories" class="hover:text-green-400">
          Categorías
        </router-link>
      </nav>
    </aside>

    <!-- Contenido -->
    <main class="flex-1 p-6">
      <router-view />
    </main>

  </div>
</template>