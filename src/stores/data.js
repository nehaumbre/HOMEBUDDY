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
  const theme        = ref('pop')
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
    rooms.value.reduce((s, r) => s + r.items.filter(i => !i.purchased).reduce((a, i) => a + (Number(i.price || 0) * (Number(i.quantity) || 1)), 0), 0)
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

    // 1. Load from LocalStorage first (for instant UI/Guest fallback)
    const localProfile = localStorage.getItem(`hb_profile_${uid_user || 'guest'}`)
    if (localProfile) {
      const p = JSON.parse(localProfile)
      maxBudget.value  = Number(p.maxBudget) || 100000
      currency.value   = p.currency   || '₹'
      theme.value      = p.theme      || 'pop'
      categories.value = p.categories || [...DEFAULT_CATS]
    }

    const localRooms = localStorage.getItem(`hb_rooms_${uid_user || 'guest'}`)
    if (localRooms && !rooms.value.length) {
      rooms.value = JSON.parse(localRooms)
    }

    if (!uid_user) {
      console.log('Running as local guest')
      if (!rooms.value.length) {
        // First-time guest seeding
        rooms.value = DEFAULT_ROOMS.map(r => ({ id: uid(), ...r, items: [], createdAt: { seconds: Date.now()/1000 } }))
        _saveLocal()
      }
      return
    }

    // 2. Sync with Firestore
    try {
      const profileSnap = await getDocs(collection(db, 'users', uid_user, 'data'))
      const profileDoc = profileSnap.docs.find(d => d.id === 'profile')
      if (profileDoc) {
        const p = profileDoc.data()
        maxBudget.value  = Number(p.maxBudget)  ?? 100000
        currency.value   = p.currency   ?? '₹'
        theme.value      = p.theme      ?? 'pop'
        categories.value = p.categories ?? [...DEFAULT_CATS]
        _saveLocal()
      } else {
        // First-time Firebase user — seed rooms
        await _seedRooms()
        await saveProfile()
      }
    } catch (e) { 
      console.error('Profile load error:', e)
    }

    // Real-time listener for rooms + items
    _unsubRooms = onSnapshot(roomsCol(), async (snap) => {
      const newRooms = []
      for (const d of snap.docs) {
        try {
          const itemsSnap = await getDocs(itemsCol(d.id))
          const items = itemsSnap.docs.map(id => ({ id: id.id, ...id.data() }))
          newRooms.push({ id: d.id, ...d.data(), items })
        } catch (e) { console.error('Error loading items for room:', d.id, e) }
      }
      newRooms.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
      rooms.value = newRooms
      _saveLocal()
      if (!activeRoom.value && newRooms.length) activeRoom.value = newRooms[0].id
    }, (err) => {
      console.warn('Firestore Snapshot error (possibly guest/rules):', err)
    })
  }

  function _saveLocal() {
    localStorage.setItem(`hb_profile_${uid_user || 'guest'}`, JSON.stringify({
      maxBudget:  maxBudget.value,
      currency:   currency.value,
      theme:      theme.value,
      categories: categories.value,
    }))
    localStorage.setItem(`hb_rooms_${uid_user || 'guest'}`, JSON.stringify(rooms.value))
  }

  async function _seedRooms() {
    const batch = writeBatch(db)
    const seeded = []
    for (const r of DEFAULT_ROOMS) {
      const id = uid()
      const roomData = { name: r.name, icon: r.icon, createdAt: serverTimestamp() }
      batch.set(roomRef(id), roomData)
      seeded.push({ id, ...roomData, items: [] })
    }
    try {
      await batch.commit()
    } catch (e) {
      console.warn('Silent seeding error (using local only):', e)
    }
    rooms.value = seeded
    _saveLocal()
  }

  async function hardResetApp() {
    // 1. Clear Firestore
    if (uid_user) {
      try {
        const batch = writeBatch(db)
        const roomsSnap = await getDocs(roomsCol())
        for (const rDoc of roomsSnap.docs) {
          const itemsSnap = await getDocs(itemsCol(rDoc.id))
          itemsSnap.forEach(iDoc => batch.delete(itemRef(rDoc.id, iDoc.id)))
          batch.delete(roomRef(rDoc.id))
        }
        batch.delete(profileRef())
        await batch.commit()
      } catch (e) {
        console.warn('Firestore reset failed:', e)
      }
    }

    // 2. Clear Local
    localStorage.removeItem(`hb_profile_${uid_user || 'guest'}`)
    localStorage.removeItem(`hb_rooms_${uid_user || 'guest'}`)

    // 3. Reset State
    rooms.value = []
    categories.value = [...DEFAULT_CATS]
    maxBudget.value = 0
    theme.value = 'pop'
    activeRoom.value = null
    activeFilter.value = 'all'
    
    // 4. Force save local (blank)
    _saveLocal()
  }

  function reset() {
    if (_unsubRooms) { _unsubRooms(); _unsubRooms = null }
    uid_user = null
    rooms.value = []
    categories.value = [...DEFAULT_CATS]
    maxBudget.value = 100000
    currency.value = '₹'
    theme.value = 'pop'
    activeRoom.value = null
    activeFilter.value = 'all'
  }

  // ─── Profile ─────────────────────────────────────────────────────────────────
  async function saveProfile() {
    _saveLocal()
    if (!uid_user) return
    try {
      await setDoc(profileRef(), {
        maxBudget:  Number(maxBudget.value),
        currency:   currency.value,
        theme:      theme.value,
        categories: categories.value,
      }, { merge: true })
    } catch (e) { console.warn('Profile sync failed:', e) }
  }

  // ─── Theme & Currency ────────────────────────────────────────────────────────
  async function setTheme(t) {
    theme.value = t
    document.documentElement.className = `theme-${t}`
    await saveProfile()
  }

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
    const rData = { name, icon, createdAt: serverTimestamp() }
    
    // Add to local state immediately
    rooms.value.push({ id, ...rData, items: [] })
    _saveLocal()
    activeRoom.value = id

    if (uid_user) {
      try {
        await setDoc(roomRef(id), rData)
      } catch (e) { console.warn('Room sync failed:', e) }
    }
    return id
  }
  async function updateRoom(id, name, icon) {
    const room = rooms.value.find(r => r.id === id)
    if (room) {
      room.name = name
      room.icon = icon
      _saveLocal()
    }
    if (uid_user) {
      try {
        await updateDoc(roomRef(id), { name, icon })
      } catch (e) { console.warn('Room update sync failed:', e) }
    }
  }
  async function deleteRoom(id) {
    const rIdx = rooms.value.findIndex(r => r.id === id)
    if (rIdx !== -1) {
      const room = rooms.value[rIdx]
      rooms.value.splice(rIdx, 1)
      _saveLocal()
      if (activeRoom.value === id) {
        activeRoom.value = rooms.value.length ? rooms.value[0].id : null
      }
    }

    if (uid_user) {
      try {
        // Delete all items first
        const itemsSnap = await getDocs(itemsCol(id))
        const batch = writeBatch(db)
        itemsSnap.forEach(d => batch.delete(itemRef(id, d.id)))
        batch.delete(roomRef(id))
        await batch.commit()
      } catch (e) {
        console.warn('Room delete sync failed:', e)
        throw new Error('Firebase blocked the deletion. (Check Firestore Rules for "delete" permission!)')
      }
    }
  }

  // ─── Items ───────────────────────────────────────────────────────────────────
  async function addItem(roomId, data) {
    const id = uid()
    const iData = { ...data, purchased: false, createdAt: serverTimestamp() }
    
    // Local Update
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      room.items.push({ id, ...iData })
      _saveLocal()
    }

    if (uid_user) {
      try {
        await setDoc(itemRef(roomId, id), iData)
      } catch (e) { console.warn('Item sync failed:', e) }
    }
  }
  async function updateItem(roomId, itemId, data) {
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      const item = room.items.find(i => i.id === itemId)
      if (item) {
        Object.assign(item, data)
        _saveLocal()
      }
    }
    if (uid_user) {
      try {
        await updateDoc(itemRef(roomId, itemId), data)
      } catch (e) { console.warn('Item update sync failed:', e) }
    }
  }
  async function deleteItem(roomId, itemId) {
    const room = rooms.value.find(r => r.id === roomId)
    if (room) {
      room.items = room.items.filter(i => i.id !== itemId)
      _saveLocal()
    }
    if (uid_user) {
      try {
        await deleteDoc(itemRef(roomId, itemId))
      } catch (e) { console.warn('Item delete sync failed:', e) }
    }
  }
  async function togglePurchased(roomId, itemId) {
    const room = rooms.value.find(r => r.id === roomId)
    if (!room) return
    const item = room.items.find(i => i.id === itemId)
    if (!item) return
    
    const newVal = !item.purchased
    item.purchased = newVal
    _saveLocal()

    if (uid_user) {
      try {
        await updateDoc(itemRef(roomId, itemId), { purchased: newVal })
      } catch (e) { console.warn('Item toggle sync failed:', e) }
    }
  }

  return {
    // State
    rooms, categories, maxBudget, currency, theme, activeRoom, activeFilter,
    // Computed
    totalEstimate, budgetPercent, isOverBudget, activeRoomData, filteredItems,
    // Methods
    formatMoney, init, reset,
    saveProfile, setCurrency, setTheme, setBudget,
    addCategory, deleteCategory,
    addRoom, updateRoom, deleteRoom,
    addItem, updateItem, deleteItem, togglePurchased,
    ICONS: ICONS,
    DEFAULT_CATS: DEFAULT_CATS,
  }
})
