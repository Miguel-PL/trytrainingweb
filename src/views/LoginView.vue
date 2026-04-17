<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()

const login = async () => {
  console.log('LOGIN CLICK')

  try {
    const response = await fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })

    const data = await response.json()

    console.log('RESPONSE:', data)

    if (!response.ok) {
      alert('Error de login')
      return
    }

    localStorage.setItem('token', data.token)

    router.push('/workouts')

  } catch (error) {
    console.error('ERROR FETCH:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-black flex items-center justify-center">

    <div class="bg-gray-900 p-8 rounded-lg w-full max-w-md">

      <h1 class="text-green-500 text-2xl font-bold mb-6 text-center">
        TRY TRAINING
      </h1>

      <form @submit.prevent="login" class="flex flex-col gap-4">

        <input
          v-model="email"
          type="email"
          placeholder="Correo electrónico"
          class="p-3 rounded bg-gray-800 text-white"
        />

        <input
          v-model="password"
          type="password"
          placeholder="Contraseña"
          class="p-3 rounded bg-gray-800 text-white"
        />

        <button type="submit" class="bg-green-500 text-black py-2 rounded">
          Iniciar sesión
        </button>

      </form>

    </div>

  </div>
</template>