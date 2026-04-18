<template>
  <div class="item-card" :class="{ purchased: item.purchased }">
    <div class="card-top">
      <span class="priority-tag" :class="item.priority">{{ priorityLabel }}</span>
      <span class="cat-tag">📁 {{ item.category }}</span>
    </div>

    <div class="card-main">
      <h4 class="item-name">{{ item.name }}</h4>
      <p v-if="item.notes" class="item-notes">{{ item.notes }}</p>
    </div>

    <div class="card-bottom">
      <div class="price-bubble">{{ data.formatMoney(item.price) }}</div>
      <div class="card-actions">
        <button class="icon-btn" @click="$emit('edit')">✏️</button>
        <button class="icon-btn danger" @click="handleDelete">🗑️</button>
        <label class="check-wrap">
          <input
            type="checkbox"
            :checked="item.purchased"
            @change="data.togglePurchased(roomId, item.id)"
          />
          <span class="check-label">BOUGHT</span>
        </label>
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
.item-card {
  background: #fff;
  border: var(--border);
  border-radius: var(--radius);
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 6px 6px 0px #000;
  transition: all var(--t);
  position: relative;
}
.item-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 10px 10px 0px #000;
}
.item-card.purchased {
  opacity: 0.6;
}

.card-top { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.priority-tag {
  padding: 0.2rem 0.6rem;
  font-size: 0.65rem;
  font-weight: 900;
  border: 1.5px solid #000;
  box-shadow: 2px 2px 0px #000;
  text-transform: uppercase;
}
.priority-tag.necessary { background: var(--primary); }
.priority-tag.later     { background: var(--secondary); }
.priority-tag.wishlist  { background: #FFC0CB; }

.cat-tag { font-size: 0.7rem; font-weight: 700; color: #666; }

.item-name {
  font-size: 1.2rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #000;
  margin-bottom: 0.3rem;
  line-height: 1.2;
}
.item-notes {
  font-size: 0.75rem;
  font-weight: 600;
  color: #444;
  line-height: 1.4;
}

.card-bottom {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: var(--border-thin);
}

.price-bubble {
  background: #000;
  color: #fff;
  padding: 4px 10px;
  font-weight: 900;
  font-size: 1.1rem;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.icon-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #000;
  background: #fff;
  box-shadow: 2px 2px 0px #000;
  transition: all var(--t);
  font-size: 0.9rem;
}
.icon-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0px #000; }
.icon-btn:active { transform: translate(1px, 1px); box-shadow: 0px 0px 0px #000; }
.icon-btn.danger:hover { background: var(--accent); color: #fff; }

.check-wrap { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; }
.check-wrap input { width: 16px; height: 16px; accent-color: #000; cursor: pointer; }
.check-label { font-size: 0.65rem; font-weight: 900; }
</style>
