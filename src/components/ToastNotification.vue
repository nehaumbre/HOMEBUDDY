<template>
  <Transition name="neo-toast">
    <div v-if="isVisible" class="toast">
      {{ toastMessage }}
    </div>
  </Transition>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
const { toastMessage, isVisible } = useToast()
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  z-index: 1200;
  background: var(--text);
  color: var(--surface);
  border: 2px solid var(--border-color);
  padding: 0.8rem 1.5rem;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  box-shadow: 6px 6px 0px var(--shadow-color);
  letter-spacing: 0.05em;
}

.neo-toast-enter-active, .neo-toast-leave-active {
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.neo-toast-enter-from {
  transform: translateY(20px) scale(0.8);
  opacity: 0;
}

.neo-toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
