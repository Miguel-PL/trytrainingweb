import { ref } from 'vue'

export function useToast() {
  const toast = ref({
    open: false,
    type: 'success', // success | error
    title: '',
    message: '',
  })

  let timer = null

  const showToast = (type, title, message, ms = 2600) => {
    toast.value = { open: true, type, title, message }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      toast.value.open = false
    }, ms)
  }

  const closeToast = () => {
    toast.value.open = false
  }

  return { toast, showToast, closeToast }
}

