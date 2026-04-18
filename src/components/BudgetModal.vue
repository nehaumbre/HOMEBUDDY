<template>
  <Transition name="modal">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-title">Edit Budget Limit</div>
        
        <div class="form-row">
          <label class="form-label">Total Budget Limit ({{ data.currency }})</label>
          <input
            ref="budgetInput"
            v-model.number="budgetLimit"
            type="number"
            class="form-input"
            placeholder="0"
            min="0"
            step="0.01"
            @keydown.enter="save"
          />
        </div>

        <div class="modal-actions">
          <button class="btn-ghost" @click="$emit('close')">Cancel</button>
          <button class="btn-primary" @click="save">Save Budget</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useDataStore } from '@/stores/data'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: Boolean
})
const emit = defineEmits(['close'])

const data = useDataStore()
const { showToast } = useToast()

const budgetLimit = ref(0)
const budgetInput = ref(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    budgetLimit.value = data.maxBudget
    nextTick(() => budgetInput.value?.focus())
  }
})

async function save() {
  const val = parseFloat(budgetLimit.value)
  if (isNaN(val) || val < 0) {
    showToast('Please enter a valid amount.')
    return
  }
  
  await data.setBudget(val)
  showToast('Budget limit updated!')
  emit('close')
}
</script>
