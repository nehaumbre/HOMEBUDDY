<template>
  <aside class="sidebar">
    <!-- Header -->
    <div class="sidebar-head">
      <div class="app-logo">
        <svg class="app-logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span class="app-logo-text">HOMEBUDDY</span>
      </div>
      
      <div class="currency-wrap">
        <label class="side-label">CURRENCY</label>
        <select
          class="neo-select"
          :value="data.currency"
          @change="data.setCurrency($event.target.value)"
        >
          <option value="₹">₹ INR</option>
          <option value="$">$ USD</option>
          <option value="€">€ EUR</option>
          <option value="£">£ GBP</option>
        </select>
      </div>
    </div>

    <!-- User Section -->
    <div class="user-block">
      <div class="user-avatar-wrap">
        <img
          v-if="auth.user?.photoURL"
          :src="auth.user.photoURL"
          class="user-avatar"
          referrerpolicy="no-referrer"
        />
        <div v-else class="user-avatar-placeholder">{{ initials }}</div>
      </div>
      <div class="user-meta">
        <div class="user-name">{{ auth.user?.isAnonymous ? 'GUEST USER' : (auth.user?.displayName || auth.user?.email?.split('@')[0] || 'USER') }}</div>
        <button class="logout-link" @click="handleSignOut">LOGOUT ↩</button>
      </div>
    </div>

    <!-- Budget Block -->
    <div class="budget-card">
      <div class="budget-row">
        <span class="card-label">BUDGET LIMIT</span>
        <button class="mini-btn" @click="$emit('openBudgetModal')">EDIT</button>
      </div>
      <div class="budget-value" :class="{ alert: data.isOverBudget }">
        {{ data.formatMoney(data.maxBudget) }}
      </div>
      <div class="budget-bar-container">
        <div 
          class="budget-bar" 
          :class="{ over: data.isOverBudget }"
          :style="{ width: data.budgetPercent + '%' }"
        ></div>
      </div>
      <div class="budget-est">EST: {{ data.formatMoney(data.totalEstimate) }}</div>
    </div>

    <!-- Rooms List -->
    <div class="section-title">MY ROOMS</div>
    <div class="rooms-list">
      <div
        v-for="room in data.rooms"
        :key="room.id"
        class="room-tab"
        :class="{ active: data.activeRoom === room.id }"
        @click="selectRoom(room.id)"
        @dblclick="$emit('editRoom', room.id)"
      >
        <span class="room-icon">{{ room.icon }}</span>
        <span class="room-name">{{ room.name }}</span>
        <span class="room-count">{{ room.items.filter(i => !i.purchased).length }}</span>
      </div>
    </div>

    <button class="add-room-btn" @click="$emit('openRoomModal')">
      ＋ ADD NEW ROOM
    </button>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataStore } from '@/stores/data'

const emit = defineEmits(['openBudgetModal', 'openRoomModal', 'editRoom'])

const auth   = useAuthStore()
const data   = useDataStore()
const router = useRouter()

const initials = computed(() => {
  if (auth.user?.isAnonymous) return 'G'
  const name = auth.user?.displayName || auth.user?.email || 'U'
  return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
})

function selectRoom(id) {
  data.activeRoom = id
  data.activeFilter = 'all'
}

async function handleSignOut() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: var(--secondary);
  border-right: var(--border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  z-index: 10;
}

.sidebar-head {
  padding: 1.5rem;
  border-bottom: var(--border-thin);
}
.app-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
}
.app-logo-svg {
  width: 24px;
  height: 24px;
  color: #000;
}
.app-logo-text { font-size: 1.4rem; font-weight: 900; letter-spacing: -0.05em; }

.currency-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
.side-label { font-size: 0.7rem; font-weight: 900; color: #000; }
.neo-select {
  background: #fff;
  border: var(--border-thin);
  padding: 0.4rem;
  font-weight: 800;
  box-shadow: 2px 2px 0px #000;
}

/* User Block */
.user-block {
  padding: 1rem 1.5rem;
  border-bottom: var(--border-thin);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: var(--bg);
}
.user-avatar-wrap {
  width: 40px; height: 40px;
  border: var(--border-thin);
  box-shadow: 2px 2px 0px #000;
  background: #fff;
  overflow: hidden;
  flex-shrink: 0;
}
.user-avatar { width: 100%; height: 100%; object-fit: cover; }
.user-avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 900; }
.user-meta { min-width: 0; }
.user-name { font-size: 0.8rem; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.logout-link { font-size: 0.7rem; font-weight: 700; color: #444; border: none; padding: 0; }
.logout-link:hover { color: var(--accent); }

/* Budget */
.budget-card {
  margin: 1.2rem;
  padding: 1rem;
  background: #fff;
  border: var(--border-thin);
  box-shadow: 4px 4px 0px #000;
}
.budget-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.card-label { font-size: 0.7rem; font-weight: 900; }
.mini-btn { font-size: 0.65rem; font-weight: 800; border: 1.5px solid #000; padding: 2px 6px; background: #eee; }
.budget-value { font-size: 1.5rem; font-weight: 900; line-height: 1; }
.budget-value.alert { color: var(--accent); }
.budget-bar-container { height: 10px; background: #eee; border: 1.5px solid #000; margin: 0.5rem 0; position: relative; }
.budget-bar { height: 100%; background: var(--primary); }
.budget-bar.over { background: var(--accent); }
.budget-est { font-size: 0.75rem; font-weight: 700; color: #444; }

/* Rooms List */
.section-title { padding: 0.5rem 1.5rem; font-size: 0.8rem; font-weight: 900; }
.rooms-list { flex: 1; overflow-y: auto; padding: 0 1rem; }
.room-tab {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  background: #fff;
  border: var(--border-thin);
  cursor: pointer;
  transition: all var(--t);
  font-weight: 800;
}
.room-tab:hover { transform: translate(-2px, -2px); box-shadow: 3px 3px 0px #000; }
.room-tab.active { background: var(--primary); transform: translate(-2px, -2px); box-shadow: 4px 4px 0px #000; }
.room-icon { font-size: 1.2rem; }
.room-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem; }
.room-count { background: #000; color: #fff; font-size: 0.65rem; padding: 1px 6px; border-radius: 99px; }

.add-room-btn {
  margin: 1rem;
  padding: 1rem;
  background: #000;
  color: #fff;
  font-weight: 900;
  border: none;
  box-shadow: 4px 4px 0px var(--primary);
  transition: all var(--t);
}
.add-room-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px var(--primary); }

@media (max-width: 480px) { .sidebar { display: none; } }
</style>
