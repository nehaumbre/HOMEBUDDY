<template>
  <Transition name="modal">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-title">Manage Categories</div>
        
        <div class="form-row">
          <label class="form-label">Add New Category</label>
          <div class="cat-manage-row">
            <input
              v-model="newCat"
              type="text"
              class="form-input"
              placeholder="e.g. Electronics, Decor…"
              maxlength="30"
              @keydown.enter="add"
            />
            <button class="cat-add-btn" @click="add">Add</button>
          </div>
        </div>

        <div class="cat-tags">
          <span v-for="cat in data.categories" :key="cat" class="cat-tag">
            {{ cat }}
            <button class="cat-tag-del" @click="data.deleteCategory(cat)">✕</button>
          </span>
        </div>

        <div class="modal-actions" style="margin-top: 1.2rem;">
          <button class="btn-primary" @click="$emit('close')">Done</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { useDataStore } from '@/stores/data'

defineProps({
  open: Boolean
})
const emit = defineEmits(['close'])

const data = useDataStore()
const newCat = ref('')

async function add() {
  const val = newCat.value.trim()
  if (!val) return
  await data.addCategory(val)
  newCat.value = ''
}
</script>

<style scoped>
.cat-manage-row {
  display: flex;
  gap: 0.5rem;
}
.cat-manage-row input {
  flex: 1;
}
.cat-add-btn {
  padding: 0.8rem 1.2rem;
  background: var(--primary);
  border: var(--border-thin);
  color: var(--white);
  font-weight: 800;
  font-size: 0.85rem;
  transition: all var(--t);
  cursor: pointer;
  box-shadow: 3px 3px 0px var(--shadow-color);
}
.cat-add-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px var(--shadow-color);
}

.cat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}
.cat-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: var(--surface);
  color: var(--text);
  border: var(--border-thin);
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: 2px 2px 0px var(--shadow-color);
}
.cat-tag-del {
  background: none;
  border: none;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 900;
  padding: 0;
  cursor: pointer;
  transition: transform var(--t);
}
.cat-tag-del:hover {
  transform: scale(1.2);
  color: var(--accent);
}
</style>
