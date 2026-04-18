<template>
  <div class="item-list-row" :class="{ purchased: item.purchased }">
    <!-- Left: Status & Priority -->
    <div class="row-left">
      <label class="check-wrap">
        <input
          type="checkbox"
          :checked="item.purchased"
          @change="data.togglePurchased(roomId, item.id)"
        />
      </label>
      <div class="priority-dot" :class="item.priority" :title="priorityLabel"></div>
    </div>

    <!-- Center: Details -->
    <div class="row-main">
      <div class="name-qty">
        <span class="item-name">{{ item.name }}</span>
        <span v-if="(item.quantity || 1) > 1" class="qty-tag">x{{ item.quantity }}</span>
      </div>
      <p v-if="item.notes" class="item-notes">{{ item.notes }}</p>
      <div class="cat-tag">📁 {{ item.category }}</div>
    </div>

    <!-- Right: Price & Actions -->
    <div class="row-right">
      <div class="price-info">
        <div class="total-price">{{ data.formatMoney(item.price * (item.quantity || 1)) }}</div>
        <div v-if="(item.quantity || 1) > 1" class="unit-price">UNIT: {{ data.formatMoney(item.price) }}</div>
      </div>
      
      <div class="row-actions">
        <button class="icon-btn" @click="$emit('edit')" title="Edit">✏️</button>
        <button class="icon-btn danger" @click="handleDelete" title="Delete">🗑️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  item:   { type: Object, required: true },
  roomId: { type: String, required: true },
})
defineEmits(['edit'])

const data = useDataStore()
const { showToast } = useToast()

const PRIORITY_LABELS = { necessary:'NECESSARY', later:'LATER', wishlist:'WISHLIST' }
const priorityLabel = computed(() => PRIORITY_LABELS[props.item.priority] || props.item.priority)

async function handleDelete() {
  if (!confirm('Remove this item?')) return
  await data.deleteItem(props.roomId, props.item.id)
  showToast('Item removed!')
}
</script>

<style scoped>
.item-list-row {
  background: var(--surface);
  color: var(--text);
  border: var(--border-thin);
  border-left: 6px solid var(--border-color);
  padding: 0.8rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  transition: all var(--t);
  box-shadow: 4px 4px 0px var(--shadow-color);
  margin-bottom: 0.5rem;
}

.item-list-row:hover {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0px var(--shadow-color);
  border-left-width: 10px;
}

.item-list-row.purchased {
  opacity: 0.5;
  background: var(--bg);
  border-left-color: var(--text-muted);
}

/* Left Section */
.row-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.check-wrap input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--border-color);
}
.priority-dot {
  width: 12px;
  height: 12px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
}
.priority-dot.necessary { background: var(--primary); }
.priority-dot.later     { background: var(--secondary); }
.priority-dot.wishlist  { background: var(--accent); }

/* Main Section */
.row-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.name-qty {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}
.item-name {
  font-weight: 900;
  font-size: 1.05rem;
  text-transform: uppercase;
}
.qty-tag {
  font-size: 0.75rem;
  font-weight: 800;
  background: var(--bg);
  color: var(--text);
  padding: 1px 6px;
  border: 1.5px solid var(--border-color);
}
.item-notes {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  margin: 2px 0;
}
.cat-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
}

/* Right Section */
.row-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.price-info {
  text-align: right;
  min-width: 80px;
}
.total-price {
  font-weight: 900;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.unit-price {
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--text-muted);
  text-transform: uppercase;
}

.row-actions {
  display: flex;
  gap: 0.4rem;
}
.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--border-color);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all var(--t);
}
.icon-btn:hover {
  background: var(--bg);
  transform: translate(-1px, -1px);
  box-shadow: 2px 2px 0px var(--shadow-color);
}
.icon-btn.danger:hover {
  background: var(--accent);
  color: var(--white);
}

@media (max-width: 600px) {
  .item-list-row {
    flex-wrap: wrap;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
  }
  .row-right {
    width: 100%;
    margin-left: 2rem;
    justify-content: space-between;
    border-top: 1px dashed var(--border-color);
    padding-top: 0.6rem;
    gap: 0.8rem;
  }
  .total-price { font-size: 1rem; }
  .item-name { font-size: 0.95rem; }
}
</style>
