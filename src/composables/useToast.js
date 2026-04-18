import { ref } from 'vue'

const toastMessage = ref('')
const isVisible = ref(false)
let timer = null

export function useToast() {
  function showToast(msg) {
    toastMessage.value = msg
    isVisible.value = true
    
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      isVisible.value = false
    }, 2500)
  }

  return {
    toastMessage,
    isVisible,
    showToast
  }
}
