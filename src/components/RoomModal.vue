<template>
  <Transition name="modal">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-title">{{ (roomId ? 'Edit Room' : 'Add Room').toUpperCase() }}</div>
        
        <div class="form-row">
          <label class="form-label">Room Icon</label>
          <div class="icon-grid">
            <button
              v-for="ic in data.ICONS"
              :key="ic"
              type="button"
              class="icon-btn"
              :class="{ selected: selectedIcon === ic }"
              @click="selectedIcon = ic"
            >
              {{ ic }}
            </button>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">Room Name</label>
          <input
            ref="nameInput"
            v-model="roomName"
            type="text"
            class="form-input"
            placeholder="e.g. Living Room"
            maxlength="40"
            @keydown.enter="save"
          />
        </div>

        <div class="modal-actions" style="margin-top: 1.5rem; display: flex; justify-content: space-between;">
          <button v-if="roomId" class="btn-ghost danger-text" @click="handleDelete" style="color: var(--accent); font-weight: 900; border: 1.5px solid var(--accent); padding: 0.5rem 1rem;">DELETE</button>
          <div style="display: flex; gap: 0.5rem; margin-left: auto;">
            <button class="btn-ghost" @click="$emit('close')">Cancel</button>
            <button class="btn-primary" @click="save">Save Room</button>
          </div>
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
  roomId: String
})
const emit = defineEmits(['close'])

const data = useDataStore()
const { showToast } = useToast()

const roomName = ref('')
const selectedIcon = ref('🏠')
const nameInput = ref(null)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    const room = props.roomId ? data.rooms.find(r => r.id === props.roomId) : null
    roomName.value = room ? room.name : ''
    selectedIcon.value = room ? room.icon : '🏠'
    nextTick(() => nameInput.value?.focus())
  }
})

async function save() {
  const name = roomName.value.trim()
  if (!name) {
    showToast('Please enter a room name.')
    return
  }

  try {
    if (props.roomId) {
      await data.updateRoom(props.roomId, name, selectedIcon.value)
      showToast('Room updated!')
    } else {
      await data.addRoom(name, selectedIcon.value)
      showToast('Room added!')
    }
  } catch (err) {
    console.warn('Room sync error:', err)
    showToast('Saved locally (cloud sync pending)')
  } finally {
    emit('close')
  }
}

async function handleDelete() {
  if (!props.roomId) return
  if (!confirm(`Are you SURE you want to delete this room and all its items? This cannot be undone.`)) return
  try {
    await data.deleteRoom(props.roomId)
    showToast('Room successfully deleted!')
  } catch (err) {
    showToast('Error: ' + err.message)
  } finally {
    emit('close')
  }
}
</script>

<style scoped>
.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.icon-btn {
  font-size: 1.5rem;
  background: var(--surface);
  border: var(--border-thin);
  border-radius: 0;
  padding: 8px;
  cursor: pointer;
  transition: all var(--t);
  line-height: 1;
}
.icon-btn:hover { background: var(--bg); transform: translate(-1px, -1px); box-shadow: 2px 2px 0px var(--shadow-color); }
.icon-btn.selected { background: var(--primary); box-shadow: 2px 2px 0px var(--shadow-color); }
</style>
