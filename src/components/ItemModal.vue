<template>
  <Transition name="modal">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-title">{{ itemId ? 'Edit Item' : 'Add Item' }}</div>
        
        <div class="form-row">
          <label class="form-label">Item Name</label>
          <input
            ref="nameInput"
            v-model="itemName"
            type="text"
            class="form-input"
            placeholder="e.g. Sofa, Air Conditioner…"
            maxlength="60"
          />
        </div>

        <div class="form-row form-2col">
          <div>
            <label class="form-label">Price ({{ data.currency }})</label>
            <input
              v-model.number="itemPrice"
              type="number"
              class="form-input"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label class="form-label">Priority</label>
            <select v-model="itemPriority" class="form-select">
              <option value="necessary">✅ Necessary</option>
              <option value="later">⏳ Buy Later</option>
              <option value="wishlist">✨ Wishlist</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Category</label>
          <select v-model="itemCategory" class="form-select">
            <option v-for="cat in data.categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <label class="form-label">Notes (optional)</label>
          <textarea
            v-model="itemNotes"
            class="form-textarea"
            placeholder="Brand preference, size, color…"
          ></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn-ghost" @click="$emit('close')">Cancel</button>
          <button class="btn-primary" @click="save">Save Item</button>
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
  open: Boolean,
  itemId: String
})
const emit = defineEmits(['close'])

const data = useDataStore()
const { showToast } = useToast()

const itemName = ref('')
const itemPrice = ref(0)
const itemPriority = ref('necessary')
const itemCategory = ref('')
const itemNotes = ref('')
const nameInput = ref(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    const room = data.activeRoomData
    if (!room) return

    const item = props.itemId ? room.items.find(i => i.id === props.itemId) : null
    
    itemName.value = item ? item.name : ''
    itemPrice.value = item ? item.price : 0
    itemPriority.value = item ? item.priority : 'necessary'
    itemCategory.value = item ? item.category : (data.categories[0] || '')
    itemNotes.value = item ? (item.notes || '') : ''
    
    nextTick(() => nameInput.value?.focus())
  }
})

async function save() {
  const name = itemName.value.trim()
  if (!name) {
    showToast('Please enter an item name.')
    return
  }

  if (!data.activeRoom) return

  const itemData = {
    name,
    price: parseFloat(itemPrice.value) || 0,
    priority: itemPriority.value,
    category: itemCategory.value,
    notes: itemNotes.value.trim()
  }

  if (props.itemId) {
    await data.updateItem(data.activeRoom, props.itemId, itemData)
    showToast('Item updated!')
  } else {
    await data.addItem(data.activeRoom, itemData)
    showToast('Item added!')
  }
  emit('close')
}
</script>
