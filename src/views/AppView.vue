<template>
  <div class="app">
    <Sidebar
      @open-budget-modal="budgetModalOpen = true"
      @open-room-modal="openRoomModal(null)"
      @edit-room="openRoomModal"
    />

    <div class="main">
      <!-- No room selected -->
      <div v-if="!data.activeRoom" class="no-room">
        <div class="no-room-icon">🛋️</div>
        <h2>No room selected</h2>
        <p>Pick a room from the sidebar — or add one — to start building your home essentials list.</p>
      </div>

      <!-- Room view -->
      <MainContent
        v-else
        @open-item-modal="openItemModal(null)"
        @edit-item="openItemModal"
        @open-cat-modal="catModalOpen = true"
      />
    </div>

    <!-- FAB -->
    <Transition name="fade">
      <button v-if="data.activeRoom" id="fab-add-item" class="fab" @click="openItemModal(null)">
        <span>＋</span> Add Item
      </button>
    </Transition>

    <!-- HomeBot Chat -->
    <HomeBotChat />

    <!-- Modals -->
    <RoomModal   :open="roomModalOpen"   :room-id="editingRoomId"   @close="roomModalOpen = false" />
    <ItemModal   :open="itemModalOpen"   :item-id="editingItemId"   @close="itemModalOpen = false" />
    <BudgetModal :open="budgetModalOpen"                            @close="budgetModalOpen = false" />
    <CategoryModal :open="catModalOpen"                             @close="catModalOpen = false" />

    <!-- Toast -->
    <ToastNotification />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDataStore } from '@/stores/data'
import Sidebar from '@/components/Sidebar.vue'
import MainContent from '@/components/MainContent.vue'
import HomeBotChat from '@/components/HomeBotChat.vue'
import RoomModal from '@/components/RoomModal.vue'
import ItemModal from '@/components/ItemModal.vue'
import BudgetModal from '@/components/BudgetModal.vue'
import CategoryModal from '@/components/CategoryModal.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const data = useDataStore()

const roomModalOpen   = ref(false)
const itemModalOpen   = ref(false)
const budgetModalOpen = ref(false)
const catModalOpen    = ref(false)
const editingRoomId   = ref(null)
const editingItemId   = ref(null)

function openRoomModal(roomId = null) {
  editingRoomId.value = roomId
  roomModalOpen.value = true
}

function openItemModal(itemId = null) {
  editingItemId.value = itemId
  itemModalOpen.value = true
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
}

/* No room placeholder */
.no-room {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  text-align: center;
  padding: 2rem;
}
.no-room-icon { 
  font-size: 5rem; 
  background: #fff;
  border: 4px solid #000;
  box-shadow: 8px 8px 0px #000;
  width: 100px; height: 100px;
  display: flex; align-items: center; justify-content: center;
}
.no-room h2 { font-size: 2rem; font-weight: 900; text-transform: uppercase; }
.no-room p  { font-weight: 700; color: #444; max-width: 320px; line-height: 1.6; }

/* FAB */
.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: var(--primary);
  color: #000;
  border: var(--border);
  border-radius: 0;
  padding: 1rem 1.8rem;
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  transition: all var(--t);
  z-index: 800;
}
.fab:hover { transform: translate(-3px, -3px); box-shadow: 8px 8px 0px #000; }
.fab:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0px #000; }

@media (max-width: 480px) {
  .main { width: 100%; }
}
</style>
