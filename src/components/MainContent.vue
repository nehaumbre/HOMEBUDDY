<template>
  <div class="main-content">
    <!-- Unified Header & Stats -->
    <div class="room-header">
      <div class="header-main">
        <div class="title-group">
          <span class="room-emoji bold-black-icon">{{ room.icon }}</span>
          <div class="title-meta">
            <h2 class="room-title">{{ room.name }}</h2>
            <div class="room-pending-meta">PENDING: {{ data.formatMoney(pendingCost) }}</div>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-pill green"><span>NECESSARY</span> <strong>{{ stats.nec }}</strong></div>
          <div class="stat-pill yellow"><span>LATER</span> <strong>{{ stats.lat }}</strong></div>
          <div class="stat-pill pink"><span>WISHLIST</span> <strong>{{ stats.wish }}</strong></div>
        </div>
      </div>
      
      <!-- Room Dashboard / Space Experiment -->
      <div class="header-dashboard">
        <div class="progress-box">
          <label class="progress-label">ROOM PROGRESS</label>
          <div class="mini-progress-bg">
            <div class="mini-progress-bar" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress-text">{{ stats.pur }} / {{ (room.items?.length || 0) }} BOUGHT</div>
        </div>
        
        <div class="header-actions">
          <button class="header-btn" @click="$emit('editRoom', room.id)">EDIT</button>
        </div>
      </div>
    </div>

    <!-- Filter & Category Bar -->
    <div class="action-bar">
      <div class="filters-scroll">
        <button
          v-for="f in filterOptions"
          :key="f.value"
          class="filter-chip"
          :class="{ active: data.activeFilter === f.value }"
          @click="data.activeFilter = f.value"
        >{{ f.label }}</button>

        <div class="v-divider"></div>

        <button
          v-for="cat in uniqueCategories"
          :key="'cat:' + cat"
          class="filter-chip cat"
          :class="{ active: data.activeFilter === 'cat:' + cat }"
          @click="data.activeFilter = 'cat:' + cat"
        >📁 {{ cat }}</button>
      </div>
      
      <button class="manage-cat-btn" @click="$emit('openCatModal')">⚙️ MANAGE</button>
    </div>

    <div class="items-area">
      <TransitionGroup name="pop-list" tag="div" class="items-list" v-if="data.filteredItems.length">
        <ItemCard
          v-for="item in data.filteredItems"
          :key="item.id"
          :item="item"
          :room-id="room.id"
          @edit="$emit('editItem', item.id)"
        />
      </TransitionGroup>

      <!-- Empty State -->
      <div v-else class="empty-pop">
        <div class="empty-icon bold-black-icon">🛋️</div>
        <h3>THIS ROOM IS EMPTY</h3>
        <p>HIT THAT "ADD ITEM" BUTTON BELOW TO POPULATE IT!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'
import ItemCard from './ItemCard.vue'

defineEmits(['openItemModal', 'editItem', 'openCatModal', 'editRoom'])

const data = useDataStore()
const room = computed(() => data.activeRoomData)

const pendingCost = computed(() =>
  room.value?.items.filter(i => !i.purchased).reduce((s, i) => s + (Number(i.price || 0) * (Number(i.quantity) || 1)), 0) ?? 0
)

const filterOptions = [
  { value: 'all',       label: 'ALL ITEMS' },
  { value: 'necessary', label: 'NECESSARY' },
  { value: 'later',     label: 'LATER' },
  { value: 'wishlist',  label: 'WISHLIST' },
  { value: 'purchased', label: 'PURCHASED' },
]

const uniqueCategories = computed(() =>
  [...new Set(room.value?.items.map(i => i.category) ?? [])]
)

const stats = computed(() => {
  const items = room.value?.items ?? []
  return {
    nec:  items.filter(i => i.priority === 'necessary' && !i.purchased).length,
    lat:  items.filter(i => i.priority === 'later'     && !i.purchased).length,
    wish: items.filter(i => i.priority === 'wishlist'  && !i.purchased).length,
    pur:  items.filter(i => i.purchased).length,
  }
})
const progressPercent = computed(() => {
  const total = room.value?.items?.length || 0
  if (total === 0) return 0
  return (stats.value.pur / total) * 100
})

</script>

<style scoped>
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* New Room Header */
.room-header {
  padding: 1.5rem 2rem;
  background: var(--secondary);
  border-bottom: var(--border);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .room-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem 1.5rem;
    gap: 1rem;
  }
}
.header-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.title-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.room-emoji { 
  font-size: 2.2rem; 
}
/* Style handled by global .bold-black-icon */
.title-meta { display: flex; flex-direction: column; }
.room-title { font-size: 2rem; font-weight: 900; text-transform: uppercase; line-height: 0.9; letter-spacing: -0.04em; }
.room-pending-meta { font-size: 0.75rem; font-weight: 800; opacity: 0.7; margin-top: 0.4rem; }

/* Header Dashboard */
.header-dashboard {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .header-dashboard {
    width: 100%;
    align-items: stretch;
  }
  .progress-box { width: 100%; }
}
.progress-box {
  background: var(--surface);
  color: var(--text);
  border: var(--border-thin);
  padding: 0.5rem 0.8rem;
  width: 180px;
  box-shadow: 4px 4px 0px var(--shadow-color);
}
.progress-label { display: block; font-size: 0.55rem; font-weight: 900; margin-bottom: 0.3rem; opacity: 0.8; }
.mini-progress-bg { height: 6px; background: var(--bg); border: 1.5px solid var(--border-color); margin-bottom: 0.3rem; position: relative; }
.mini-progress-bar { height: 100%; background: var(--primary); transition: width 0.3s ease; }
.progress-text { font-size: 0.6rem; font-weight: 900; text-align: right; }

.header-actions { display: flex; gap: 0.6rem; }
.header-btn {
  padding: 0.4rem 1rem;
  background: var(--text);
  color: var(--surface);
  font-weight: 900;
  font-size: 0.7rem;
  border: none;
  box-shadow: 3px 3px 0px var(--secondary);
}
.header-btn:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0px var(--secondary); }

 .header-stats {
   display: flex;
   gap: 0.6rem;
   flex-wrap: wrap;
 }
 .stat-pill {
   display: flex;
   align-items: center;
   gap: 0.5rem;
   padding: 0.3rem 0.6rem;
   border: 1.5px solid var(--border-color);
   font-size: 0.6rem;
   font-weight: 800;
   background: var(--surface);
   color: var(--text);
 }
 .stat-pill strong { font-size: 0.8rem; color: var(--text); }
 .stat-pill.green { background: var(--primary); }
 .stat-pill.yellow { background: var(--secondary); }
 .stat-pill.pink { background: var(--accent); }

/* Action Bar */
.action-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 2rem;
  background: var(--surface);
  border-bottom: var(--border-thin);
}
.filters-scroll { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  gap: 0.5rem; 
  overflow-x: auto; 
  padding: 0.4rem 0;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.filters-scroll::-webkit-scrollbar { display: none; }

.filter-chip {
  padding: 0.3rem 0.8rem;
  border: 1.5px solid var(--border-color);
  font-weight: 800;
  font-size: 0.7rem;
  color: var(--text);
  white-space: nowrap;
}
.filter-chip.active { background: var(--text); color: var(--surface); }
.filter-chip.cat { border-style: dashed; opacity: 0.7; }

.v-divider { width: 1.5px; height: 18px; background: var(--text); margin: 0 0.4rem; opacity: 0.2; }
.manage-cat-btn { font-size: 0.6rem; font-weight: 900; color: var(--text); border: 1.5px solid var(--border-color); padding: 3px 8px; background: var(--bg); }

/* Items */
.items-area { flex: 1; overflow-y: auto; padding: 1.5rem 2rem; }
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.empty-pop {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 300px; text-align: center; gap: 1rem;
}
.empty-icon { font-size: 4rem; margin-bottom: 0.5rem; }
.empty-pop h3 { font-size: 1.5rem; font-weight: 900; }
.empty-pop p { font-weight: 700; color: #666; max-width: 300px; }

/* Pop list transition */
.pop-list-enter-active { transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pop-list-leave-active { transition: all 0.15s ease; }
.pop-list-enter-from { opacity: 0; transform: scale(0.5) rotate(-5deg); }
.pop-list-leave-to { opacity: 0; transform: scale(0.8); }

@media (max-width: 768px) {
  .room-title { font-size: 1.6rem; }
  .action-bar { padding: 0.6rem 1.5rem; }
  .items-area { padding: 1rem 1.5rem; }
  .empty-pop h3 { font-size: 1.2rem; }
  .empty-pop p { font-size: 0.8rem; }
}

@media (max-width: 480px) {
  .room-header { padding: 1rem; }
  .action-bar { padding: 0.5rem 1rem; }
  .items-area { padding: 1rem; }
}
</style>
