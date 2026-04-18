<template>
  <div class="chat-container">
    <button class="chat-fab" :class="{ open: isOpen }" @click="toggleChat" title="Ask HomeBot">
      {{ isOpen ? '✕' : '🤖' }}
    </button>

    <Transition name="neo-slide">
      <div v-if="isOpen" class="chat-panel">
        <div class="chat-header">
          <div class="chat-avatar">🤖</div>
          <div class="chat-info">
            <div class="chat-name">HOMEBOT</div>
            <div class="chat-status">{{ statusText }}</div>
          </div>
          <button class="chat-close-btn" @click="toggleChat">✕ CLOSE</button>
        </div>

        <div ref="msgsContainer" class="chat-messages">
          <div v-for="(msg, i) in messages" :key="i" class="chat-msg" :class="msg.role">
            <div class="chat-bubble">
              <div v-html="formatText(msg.text)" class="chat-text"></div>
              
              <div v-if="msg.addedItems?.length" class="chat-added-items">
                <div v-for="item in msg.addedItems" :key="item.id" class="chat-added-item">
                  ✅ {{ item.name }} -> {{ data.formatMoney(item.price) }}
                </div>
              </div>
            </div>
            <span class="chat-time">{{ msg.time }}</span>
          </div>

          <!-- Typing indicator -->
          <div v-if="isTyping" class="chat-msg bot">
            <div class="chat-bubble typing">
              <div class="chat-dot"></div>
              <div class="chat-dot"></div>
              <div class="chat-dot"></div>
            </div>
          </div>
        </div>

        <div v-if="messages.length < 2 && !isTyping" class="chat-suggestions">
          <button
            v-for="s in suggestions"
            :key="s"
            class="chat-tag"
            @click="useSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>

        <div class="chat-input-row">
          <input
            v-model="input"
            class="chat-input"
            placeholder="ASK HOMEBOT..."
            :disabled="isTyping"
            @keydown.enter="send"
          />
          <button class="chat-send" :disabled="!input.trim() || isTyping" @click="send">
            SEND
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useDataStore } from '@/stores/data'

const data = useDataStore()

const isOpen = ref(false)
const input = ref('')
const isTyping = ref(false)
const messages = ref([])
const statusText = ref('● READY TO HELP')
const msgsContainer = ref(null)

const suggestions = [
  'What do I need for a bedroom?',
  'Add sofa, TV and coffee table',
  'Kitchen must-haves on a budget'
]

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value && messages.value.length === 0) {
    appendBot(`👋 YO! I'm **HOMEBOT**!\n\nTell me what you need for your room and I'll add it to the list automatically.\n\n*Try: "Add a fridge and a microwave"*`)
  }
}

function useSuggestion(text) {
  input.value = text
  send()
}

function formatText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/\n/g,'<br/>')
}

function appendBot(text, addedItems = []) {
  messages.value.push({
    role: 'bot',
    text,
    addedItems,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
  scrollToBottom()
}

function appendUser(text) {
  messages.value.push({
    role: 'user',
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
  scrollToBottom()
}

async function scrollToBottom() {
  await nextTick()
  if (msgsContainer.value) {
    msgsContainer.value.scrollTop = msgsContainer.value.scrollHeight
  }
}

let lastCallTime = 0
const COOLDOWN = 3000

async function callGemini(userMsg) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return { error: 'API KEY MISSING!' }
  }

  const wait = COOLDOWN - (Date.now() - lastCallTime)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastCallTime = Date.now()

  const room = data.activeRoomData
  const roomName = room ? room.name : 'unspecified'
  const existing = room ? room.items.map(i => i.name).join(', ') || 'none' : 'none'

  const systemPrompt = `You are HomeBot, a practical home-setup advisor. RETRO POP style.
Context: Room: ${roomName}, Currency: ${data.currency}, Existing: ${existing}.
CATEGORIES: ${data.categories.join(', ')}.
PRIORITIES: necessary, later, wishlist.
RESPONSE: 2 sentences max + JSON block of items. Realistic prices in ${data.currency}.
\`\`\`json
[{"name":"Item","price":100,"priority":"necessary","category":"Furniture","reason":"Reason"}]
\`\`\``

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt + "\nUser: " + userMsg }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1000 }
        })
      }
    )
    if (!res.ok) return { error: 'API ERROR' }
    const resData = await res.json()
    return { text: resData.candidates?.[0]?.content?.parts?.[0]?.text || '' }
  } catch (e) {
    return { error: 'NETWORK ERROR' }
  }
}

async function send() {
  const msg = input.value.trim()
  if (!msg) return
  input.value = ''
  appendUser(msg)
  
  if (!data.activeRoom) {
    appendBot('⚠️ SELECT A ROOM FIRST!')
    return
  }
  
  isTyping.value = true
  statusText.value = '○ THINKING...'
  const result = await callGemini(msg)
  isTyping.value = false
  statusText.value = '● READY TO HELP'
  
  if (result.error) {
    appendBot('❌ ' + result.error)
  } else {
    const jsonMatch = result.text.match(/```json\s*([\s\S]*?)```/)
    let addedItems = []
    if (jsonMatch) {
      try {
        const items = JSON.parse(jsonMatch[1])
        if (Array.isArray(items)) {
          for (const item of items) {
            const newItem = {
              name: item.name,
              price: parseFloat(item.price) || 0,
              priority: ['necessary', 'later', 'wishlist'].includes(item.priority) ? item.priority : 'later',
              category: data.categories.includes(item.category) ? item.category : data.categories[0],
              notes: item.reason || ''
            }
            await data.addItem(data.activeRoom, newItem)
            addedItems.push(newItem)
          }
        }
      } catch (e) { console.error(e) }
    }
    const displayText = result.text.replace(/```json[\s\S]*?```/g, '').trim()
    appendBot(displayText || 'DONE!', addedItems)
  }
}
</script>

<style scoped>
.chat-fab {
  position: fixed;
  bottom: 2rem;
  right: 11rem;
  width: 60px; height: 60px;
  background: var(--primary);
  border: var(--border);
  box-shadow: 4px 4px 0px #000;
  font-size: 1.5rem;
  display: flex; align-items: center; justify-content: center;
  z-index: 800; transition: all var(--t);
}
.chat-fab:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px #000; }
.chat-fab.open { background: #000; color: #fff; }

.chat-panel {
  position: fixed;
  bottom: 6.5rem;
  right: 2rem;
  width: 380px;
  max-height: 500px;
  background: #fff;
  border: var(--border);
  box-shadow: 10px 10px 0px #000;
  display: flex; flex-direction: column;
  z-index: 900; overflow: hidden;
}

.chat-header {
  background: var(--secondary);
  padding: 1rem;
  border-bottom: var(--border-thin);
  display: flex; align-items: center; gap: 0.8rem;
}
.chat-avatar {
  background: #000; color: #fff;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900;
}
.chat-info { flex: 1; }
.chat-name { font-weight: 900; font-size: 0.8rem; letter-spacing: 0.05em; }
.chat-status { font-size: 0.6rem; font-weight: 800; color: #000; }
.chat-close-btn { font-size: 0.6rem; font-weight: 900; border: 1.5px solid #000; padding: 2px 6px; }

.chat-messages {
  flex: 1; overflow-y: auto;
  padding: 1rem;
  background: var(--bg);
  display: flex; flex-direction: column; gap: 0.8rem;
}
.chat-msg { display: flex; flex-direction: column; max-width: 85%; }
.chat-msg.bot { align-self: flex-start; }
.chat-msg.user { align-self: flex-end; }

.chat-bubble {
  padding: 0.8rem;
  border: 2px solid #000;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 3px 3px 0px #000;
}
.chat-msg.bot .chat-bubble { background: #fff; }
.chat-msg.user .chat-bubble { background: var(--secondary); }

.chat-time { font-size: 0.55rem; font-weight: 800; margin-top: 0.2rem; padding: 0 4px; }
.chat-msg.user .chat-time { align-self: flex-end; }

.chat-added-items { margin-top: 0.6rem; border-top: 1px dashed #000; padding-top: 0.4rem; display: flex; flex-direction: column; gap: 0.2rem; }
.chat-added-item { font-size: 0.7rem; font-weight: 900; color: #000; }

.chat-suggestions { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.6rem 1rem; background: var(--bg); }
.chat-tag { font-size: 0.65rem; font-weight: 900; border: 1.5px solid #000; padding: 2px 8px; background: #fff; box-shadow: 2px 2px 0px #000; }

.chat-input-row { display: flex; gap: 0.5rem; padding: 0.8rem 1rem; border-top: var(--border-thin); background: #fff; }
.chat-input { flex: 1; border: 2px solid #000; padding: 0.5rem; font-weight: 900; font-size: 0.8rem; text-transform: uppercase; }
.chat-send { background: var(--primary); font-weight: 900; padding: 0 1rem; border: 2px solid #000; box-shadow: 3px 3px 0px #000; }

.typing { display: flex; gap: 4px; align-items: center; width: fit-content; }
.chat-dot { width: 5px; height: 5px; background: #000; border-radius: 50%; animation: pop 1s infinite; }
.chat-dot:nth-child(2) { animation-delay: 0.2s; }
.chat-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes pop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.5); } }

.neo-slide-enter-active, .neo-slide-leave-active { transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.neo-slide-enter-from, .neo-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.9); }
</style>
