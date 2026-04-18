<template>
  <div class="main-content">
    <!-- Retro Top Bar -->
    <div class="topbar">
      <div class="topbar-info">
        <span class="room-emoji">{{ room.icon }}</span>
        <h2 class="room-title">{{ room.name }}</h2>
      </div>
      <div class="topbar-stats">
        EST. PENDING: <span class="highlight">{{ data.formatMoney(pendingCost) }}</span>
      </div>
    </div>

    <!-- Pop Filter Bar -->
    <div class="filters-container">
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
      
      <button class="manage-cat-btn" @click="$emit('openCatModal')">⚙️ CATEGORIES</button>
    </div>

    <!-- Aggressive Stats Bar -->
    <div class="stats-bar">
      <div class="stat-pill green"><span>✅ NECESSARY</span> <strong>{{ stats.nec }}</strong></div>
      <div class="stat-pill yellow"><span>⏳ BUY LATER</span> <strong>{{ stats.lat }}</strong></div>
      <div class="stat-pill pink"><span>✨ WISHLIST</span> <strong>{{ stats.wish }}</strong></div>
      <div class="stat-pill black"><span>🛒 BOUGHT</span> <strong>{{ stats.pur }}</strong></div>
    </div>

    <!-- Items Grid (Bento Style) -->
    <div class="items-area">
      <TransitionGroup name="pop-list" tag="div" class="items-grid" v-if="data.filteredItems.length">
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
        <div class="empty-icon">🛋️</div>
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

defineEmits(['openItemModal', 'editItem', 'openCatModal'])

const data = useDataStore()
const room = computed(() => data.activeRoomData)

const pendingCost = computed(() =>
  room.value?.items.filter(i => !i.purchased).reduce((s, i) => s + i.price, 0) ?? 0
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
</script>

<style scoped>
.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Topbar */
.topbar {
  padding: 1.5rem 2rem;
  background: var(--secondary);
  border-bottom: var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
}
.topbar-info { display: flex; align-items: center; gap: 0.8rem; }
.room-emoji { font-size: 2rem; }
.room-title { font-size: 2rem; font-weight: 900; text-transform: uppercase; color: #000; letter-spacing: -0.04em; }
.topbar-stats { font-weight: 800; font-size: 0.9rem; }
.highlight { background: #000; color: var(--secondary); padding: 2px 8px; }

/* Filters */
.filters-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 2rem;
  background: #fff;
  border-bottom: var(--border-thin);
  flex-shrink: 0;
}
.filters-scroll { display: flex; align-items: center; gap: 0.5rem; overflow-x: auto; flex: 1; padding-bottom: 4px; }
.filters-scroll::-webkit-scrollbar { height: 4px; }

.filter-chip {
  padding: 0.4rem 1rem;
  background: #fff;
  border: 2px solid #000;
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  white-space: nowrap;
  transition: all var(--t);
}
.filter-chip:hover { transform: translate(-1px, -1px); box-shadow: 2px 2px 0px #000; }
.filter-chip.active { background: #000; color: #fff; }
.filter-chip.cat { border-style: dashed; }

.v-divider { width: 2px; height: 24px; background: #000; margin: 0 0.5rem; flex-shrink: 0; }

.manage-cat-btn { font-size: 0.7rem; font-weight: 900; border: 2px solid #000; padding: 4px 10px; background: #eee; }

/* Stats Bar */
.stats-bar {
  display: flex; gap: 1rem; flex-wrap: wrap;
  padding: 0.8rem 2rem;
  background: var(--bg);
  border-bottom: var(--border-thin);
  flex-shrink: 0;
}
.stat-pill {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.4rem 0.8rem;
  border: 2px solid #000;
  font-size: 0.7rem;
  font-weight: 800;
}
.stat-pill strong { font-size: 0.9rem; }
.stat-pill.green { background: var(--primary); }
.stat-pill.yellow { background: var(--secondary); }
.stat-pill.pink { background: #FFC0CB; }
.stat-pill.black { background: #000; color: #fff; }

/* Items */
.items-area { flex: 1; overflow-y: auto; padding: 2rem; }
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
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

@media (max-width: 680px) {
  .topbar, .filters-container, .stats-bar, .items-area { padding-left: 1rem; padding-right: 1rem; }
  .items-grid { grid-template-columns: 1fr; }
}
</style>
