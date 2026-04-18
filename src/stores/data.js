import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase'
import {
  doc, collection, getDocs, setDoc, updateDoc,
  deleteDoc, onSnapshot, writeBatch, serverTimestamp,
} from 'firebase/firestore'

// ─── Constants ────────────────────────────────────────────────────────────────
export const ICONS = ['🛋️','🛏️','🍳','🚿','📦','🏠','🌿','🪑','💻','🎮','📚','🧹','🔧','🪴','🖼️','🐱','🐶','🏋️','🎵','🍽️']
export const DEFAULT_CATS = ['Furniture','Appliances','Bedding','Kitchen','Electronics','Decor','Bathroom','Outdoor']

export const EXCHANGE_RATES = { '₹': 1, '$': 0.012, '€': 0.011, '£': 0.0094 }
export const CURRENCY_LOCALES = { '₹': 'en-IN', '$': 'en-US', '€': 'de-DE', '£': 'en-GB' }

const DEFAULT_ROOMS = [
  { name: 'Master Bedroom', icon: '🛏️' },
  { name: 'Bedroom 2',      icon: '🛏️' },
  { name: 'Bathroom 1',     icon: '🚿' },
  { name: 'Bathroom 2',     icon: '🚿' },
  { name: 'Kitchen',        icon: '🍳' },
  { name: 'Balcony 1',      icon: '🪴' },
  { name: 'Balcony 2',      icon: '🪴' },
  { name: 'Balcony 3',      icon: '🪴' },
]

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7) }

export const useDataStore = defineStore('data', () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const rooms        = ref([])             // [{ id, name, icon, items: [] }]
  const categories   = ref([...DEFAULT_CATS])
  const maxBudget    = ref(100000)
  const currency     = ref('₹')
  const activeRoom   = ref(null)
  const activeFilter = ref('all')
  let   uid_user     = null
  let   _unsubRooms  = null

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function profileRef() { return doc(db, 'users', uid_user, 'data', 'profile') }
  function roomsCol()   { return collection(db, 'users', uid_user, 'rooms') }
  function roomRef(id)  { return doc(db, 'users', uid_user, 'rooms', id) }
  function itemsCol(rId){ return collection(db, 'users', uid_user, 'rooms', rId, 'items') }
  function itemRef(rId, iId) { return doc(db, 'users', uid_user, 'rooms', rId, 'items', iId) }

  // ─── Format Money ────────────────────────────────────────────────────────────
  function formatMoney(amount) {
    const locale = CURRENCY_LOCALES[currency.value] || 'en-US'
    return currency.value + ' ' + Number(amount || 0).toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  // ─── Computed ────────────────────────────────────────────────────────────────
  const totalEstimate = computed(() =>
    rooms.value.reduce((s, r) => s + r.items.filter(i => !i.purchased).reduce((a, i) => a + i.price, 0), 0)
  )
  const budgetPercent = computed(() =>
    maxBudget.value > 0 ? Math.min((totalEstimate.value / maxBudget.value) * 100, 100) : 0
  )
  const isOverBudget = computed(() => totalEstimate.value > maxBudget.value)

  const activeRoomData = computed(() => rooms.value.find(r => r.id === activeRoom.value) || null)

  const filteredItems = computed(() => {
    const room = activeRoomData.value
    if (!room) return []
    const f = activeFilter.value
    if (f === 'all')        return room.items.filter(i => !i.purchased)
    if (f === 'purchased')  return room.items.filter(i =>  i.purchased)
    if (f.startsWith('cat:')) {
      const cat = f.slice(4)
      return room.items.filter(i => i.category === cat && !i.purchased)
    }
    return room.items.filter(i => i.priority === f && !i.purchased)
  })

  // ─── Init (called after auth) ─────────────────────────────────────────────
  async function init(userId) {
    uid_user = userId
    if (_unsubRooms) { _unsubRooms(); _unsubRooms = null }

    // Load profile
    try {
      const profileSnap = await getDocs(collection(db, 'users', uid_user, 'data'))
      const profileDoc = profileSnap.docs.find(d => d.id === 'profile')
      if (profileDoc) {
        const p = profileDoc.data()
        maxBudget.value  = p.maxBudget  ?? 100000
        currency.value   = p.currency   ?? '₹'
        categories.value = p.categories ?? [...DEFAULT_CATS]
      } else {
        // First-time user — seed rooms
        await _seedRooms()
        await saveProfile()
      }
    } catch (e) { console.error('Profile load error:', e) }

    // Real-time listener for rooms + items
    _unsubRooms = onSnapshot(roomsCol(), async (snap) => {
      const newRooms = []
      for (const d of snap.docs) {
        const itemsSnap = await getDocs(itemsCol(d.id))
        const items = itemsSnap.docs.map(id => ({ id: id.id, ...id.data() }))
        newRooms.push({ id: d.id, ...d.data(), items })
      }
      // Sort by createdAt so order is stable
      newRooms.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
      rooms.value = newRooms
      // Auto-select first room if none selected
      if (!activeRoom.value && newRooms.length) activeRoom.value = newRooms[0].id
    })
  }

  async function _seedRooms() {
    const batch = writeBatch(db)
    for (const r of DEFAULT_ROOMS) {
      const id = uid()
      batch.set(roomRef(id), { name: r.name, icon: r.icon, createdAt: serverTimestamp() })
    }
    await batch.commit()
  }

  function reset() {
    if (_unsubRooms) { _unsubRooms(); _unsubRooms = null }
    uid_user = null
    rooms.value = []
    categories.value = [...DEFAULT_CATS]
    maxBudget.value = 100000
    currency.value = '₹'
    activeRoom.value = null
    activeFilter.value = 'all'
  }

  // ─── Profile ─────────────────────────────────────────────────────────────────
  async function saveProfile() {
    if (!uid_user) return
    await setDoc(profileRef(), {
      maxBudget:  maxBudget.value,
      currency:   currency.value,
      categories: categories.value,
    }, { merge: true })
  }

  // ─── Currency ────────────────────────────────────────────────────────────────
  async function setCurrency(sym) {
    if (sym === currency.value) return
    const from   = EXCHANGE_RATES[currency.value] || 1
    const to     = EXCHANGE_RATES[sym] || 1
    const factor = to / from

    maxBudget.value = Math.round(maxBudget.value * factor * 100) / 100

    const batch = writeBatch(db)
    for (const room of rooms.value) {
      for (const item of room.items) {
        const newPrice = Math.round(item.price * factor * 100) / 100
        batch.update(itemRef(room.id, item.id), { price: newPrice })
        item.price = newPrice
      }
    }
    await batch.commit()

    currency.value = sym
    await saveProfile()
  }

  // ─── Budget ──────────────────────────────────────────────────────────────────
  async function setBudget(val) {
    maxBudget.value = val
    await saveProfile()
  }

  // ─── Categories ──────────────────────────────────────────────────────────────
  async function addCategory(name) {
    if (!categories.value.includes(name)) {
      categories.value.push(name)
      await saveProfile()
    }
  }
  async function deleteCategory(name) {
    categories.value = categories.value.filter(c => c !== name)
    await saveProfile()
  }

  // ─── Rooms ───────────────────────────────────────────────────────────────────
  async function addRoom(name, icon) {
    const id = uid()
    await setDoc(roomRef(id), { name, icon, createdAt: serverTimestamp() })
    activeRoom.value = id
    return id
  }
  async function updateRoom(id, name, icon) {
    await updateDoc(roomRef(id), { name, icon })
  }
  async function deleteRoom(id) {
    // Delete all items first
    const room = rooms.value.find(r => r.id === id)
    if (room) {
      const batch = writeBatch(db)
      for (const item of room.items) batch.delete(itemRef(id, item.id))
      await batch.commit()
    }
    await deleteDoc(roomRef(id))
    if (activeRoom.value === id) {
      const remaining = rooms.value.filter(r => r.id !== id)
      activeRoom.value = remaining.length ? remaining[0].id : null
    }
  }

  // ─── Items ───────────────────────────────────────────────────────────────────
  async function addItem(roomId, data) {
    const id = uid()
    await setDoc(itemRef(roomId, id), {
      ...data, purchased: false, createdAt: serverTimestamp()
    })
    // Optimistic local update while Firestore re-syncs
    const room = rooms.value.find(r => r.id === roomId)
    if (room) room.items.push({ id, ...data, purchased: false })
  }
  async function updateItem(roomId, itemId, data) {
    await updateDoc(itemRef(roomId, itemId), data)
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      const item = room.items.find(i => i.id === itemId)
      if (item) Object.assign(item, data)
    }
  }
  async function deleteItem(roomId, itemId) {
    await deleteDoc(itemRef(roomId, itemId))
    const room = rooms.value.find(r => r.id === roomId)
    if (room) room.items = room.items.filter(i => i.id !== itemId)
  }
  async function togglePurchased(roomId, itemId) {
    const room = rooms.value.find(r => r.id === roomId)
    if (!room) return
    const item = room.items.find(i => i.id === itemId)
    if (!item) return
    const newVal = !item.purchased
    item.purchased = newVal
    await updateDoc(itemRef(roomId, itemId), { purchased: newVal })
  }

  return {
    // State
    rooms, categories, maxBudget, currency, activeRoom, activeFilter,
    // Computed
    totalEstimate, budgetPercent, isOverBudget, activeRoomData, filteredItems,
    // Methods
    formatMoney, init, reset,
    saveProfile, setCurrency, setBudget,
    addCategory, deleteCategory,
    addRoom, updateRoom, deleteRoom,
    addItem, updateItem, deleteItem, togglePurchased,
    ICONS: ICONS,
    DEFAULT_CATS: DEFAULT_CATS,
  }
})
