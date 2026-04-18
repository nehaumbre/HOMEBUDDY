<template>
  <RouterView />
</template>

<script setup>
import { useDataStore } from '@/stores/data'
import { watchEffect } from 'vue'

const data = useDataStore()

watchEffect(() => {
  if (data.theme) {
    document.documentElement.className = `theme-${data.theme}`
  }
})
</script>
