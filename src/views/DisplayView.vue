<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const workout = ref(null)

const getGridClass = (count) => {
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-2'
  if (count === 3) return 'grid-cols-3'
  if (count === 4) return 'grid-cols-4'
  return 'grid-cols-4'
}
const formatType = (ex) => {
  return ex.type === 'time'
    ? `${ex.value} segundos`
    : `${ex.value} repeticiones`
}

onMounted(async () => {
  const response = await fetch(
    `http://127.0.0.1:8000/api/workouts/${route.params.id}/display`
  )

  workout.value = await response.json()
})
</script>

<template>
  <div class="bg-black text-white min-h-screen flex flex-col p-4">

    <!-- Título -->
    <h1 class="text-3xl text-green-500 text-center mb-4">
      {{ workout?.name }}
    </h1>

    <!-- Bloques -->
    <div class="flex-1 flex flex-col gap-4">

      <div
        v-for="block in workout?.blocks"
        :key="block.name"
        class="flex-1 bg-gray-900 rounded p-4 flex flex-col"
      >
        <h2 class="text-xl text-green-400 mb-2">
          {{ block.name }}
        </h2>

        <!-- Ejercicios -->
        <div class="flex-1 grid gap-2"
             :class="getGridClass(block.exercises.length || 0)"
        >
          <div
            v-for="ex in block.exercises"
            :key="ex.id || ex.name"
            class="bg-gray-800 rounded p-2 flex flex-col items-center justify-center text-center"
            >
                <div class="flex flex-col h-full">
                    <!-- VIDEO -->
                    <video
                        src="https://www.w3schools.com/html/mov_bbb.mp4"
                        autoplay
                        loop
                        muted
                        class="w-full h-2/3 object-cover rounded mb-1"
                    ></video>

                    <!-- TEXTO -->
                    <div class="h-1/3 flex flex-col justify-center text-center">
                        <p class="font-bold text-xs">{{ ex.name }}</p>

                        <p class="text-sm">
                            {{ formatType(ex) }}
                        </p>

                        <p class="text-xs text-gray-400">
                            {{ ex.intensity }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

      </div>

    </div>

  </div>
</template>