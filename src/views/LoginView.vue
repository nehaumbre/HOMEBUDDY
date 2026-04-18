<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Professional House Logo (SVG) -->
      <div class="login-logo">
        <svg class="login-logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <h1 class="login-logo-text">HomeBuddy</h1>
      </div>
      <p class="login-tagline">Organize your first home in style.</p>

      <!-- Pop Art Features with Hover Effects -->
      <div class="login-features">
        <div class="feature-tag pink pop-hover">🛋️ Rooms</div>
        <div class="feature-tag green pop-hover">💰 Budget</div>
        <div class="feature-tag yellow pop-hover">🤖 HOMEBuddyAI</div>
      </div>

      <!-- Auth Tabs -->
      <div class="auth-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: authMode === 'login' }" 
          @click="authMode = 'login'"
        >LOGIN</button>
        <button 
          class="tab-btn" 
          :class="{ active: authMode === 'register' }" 
          @click="authMode = 'register'"
        >REGISTER</button>
      </div>

      <div class="auth-form-container">
        <!-- Email/Password Form -->
        <form @submit.prevent="handleEmailAuth" class="auth-form">
          <div class="form-row">
            <input 
              v-model="email" 
              type="email" 
              class="form-input" 
              placeholder="EMAIL ADDRESS" 
              required 
            />
          </div>
          <div class="form-row password-row">
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              class="form-input" 
              placeholder="PASSWORD" 
              required 
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              {{ showPassword ? 'HIDE' : 'SHOW' }}
            </button>
          </div>
          <button 
            type="submit" 
            class="neo-button auth-submit-btn" 
            :disabled="isLoading"
          >
            {{ isLoading ? 'WORKING...' : (authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT') }}
          </button>
        </form>

        <div class="login-divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <!-- Google Sign-in Button -->
        <button
          class="google-btn pop-hover"
          :disabled="isLoading"
          @click="handleGoogleSignIn"
        >
          <div class="google-btn-content">
            <span v-if="!isLoading" class="google-icon">
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.34-8.16 2.34-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </span>
            <span v-if="isLoading" class="spinner-small" />
            <span class="btn-text">GOOGLE ACCOUNT</span>
          </div>
        </button>

        <!-- Guest Section -->
        <div class="guest-section">
          <button class="guest-link" @mouseover="guestHover = true" @mouseleave="guestHover = false" @click="handleGuestSignIn">
            TRY AS A GUEST (ZERO LOGIN) {{ guestHover ? '➜' : '' }}
          </button>
        </div>
      </div>

      <Transition name="fade">
        <div v-if="errorMsg" class="login-error">💥 {{ errorMsg }}</div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(false)
const errorMsg = ref('')
const authMode = ref('login') // 'login' or 'register'
const guestHover = ref(false)
const showPassword = ref(false)

const email = ref('')
const password = ref('')

async function handleEmailAuth() {
  isLoading.value = true
  errorMsg.value = ''
  try {
    if (authMode.value === 'login') {
      await authStore.signInWithEmail(email.value, password.value)
    } else {
      await authStore.signUpWithEmail(email.value, password.value)
    }
    router.push({ name: 'home' })
  } catch (err) {
    errorMsg.value = err.message || 'Authentication failed. Please check your credentials.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

async function handleGoogleSignIn() {
  isLoading.value = true
  errorMsg.value = ''
  try {
    await authStore.signInWithGoogle()
    router.push({ name: 'home' })
  } catch (err) {
    errorMsg.value = 'Sign-in failed. Try again!'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

async function handleGuestSignIn() {
  isLoading.value = true
  errorMsg.value = ''
  try {
    await authStore.continueAsGuest()
    router.push({ name: 'home' })
  } catch (err) {
    errorMsg.value = 'Guest entry failed. Please try again.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 2rem;
}

.login-card {
  background: #fff;
  border: 4px solid #000;
  box-shadow: 12px 12px 0px #000;
  padding: 2.5rem;
  width: 100%;
  max-width: 480px;
  text-align: center;
}

/* Logo SVG */
.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.login-logo-svg {
  width: 64px;
  height: 64px;
  color: #000;
  filter: drop-shadow(4px 4px 0px var(--primary));
}
.login-logo-text {
  font-size: 2.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  color: #000;
  line-height: 1;
}

.login-tagline {
  font-weight: 600;
  color: #333;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

/* Features */
.login-features {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 2rem;
}
.feature-tag {
  padding: 0.4rem 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.72rem;
  border: 2.5px solid #000;
}
.feature-tag.pink   { background: #FFD1DC; }
.feature-tag.green  { background: #32CD32; }
.feature-tag.yellow { background: #FFEA00; }

/* Tabs */
.auth-tabs {
  display: flex;
  border: 3px solid #000;
  margin-bottom: 1.5rem;
  background: #000;
  gap: 3px;
}
.tab-btn {
  flex: 1;
  padding: 0.8rem;
  background: #fff;
  border: none;
  font-weight: 900;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--t);
}
.tab-btn.active {
  background: var(--secondary);
}
.tab-btn:not(.active):hover {
  background: #eee;
}

/* Auth Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.auth-submit-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.password-row {
  position: relative;
}
.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-family: inherit;
  font-weight: 900;
  font-size: 0.65rem;
  color: #888;
  cursor: pointer;
  padding: 5px;
  z-index: 5;
  transition: color 0.2s;
}
.password-toggle:hover {
  color: #000;
}

.login-divider {
  margin: 1.5rem 0;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.7rem;
  position: relative;
}
.login-divider::before {
  content: '';
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 2px;
  background: #000;
  z-index: 1;
}
.login-divider span {
  position: relative;
  z-index: 2;
  background: #fff;
  padding: 0 1rem;
}

.google-btn {
  width: 100%;
  padding: 0.85rem;
  background: #fff;
  border: 3px solid #000;
  transition: all var(--t);
}
.google-btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
}
.btn-text { font-weight: 900; letter-spacing: 0.05em; font-size: 0.88rem; }

.guest-section {
  margin-top: 1.8rem;
}
.guest-link {
  font-size: 0.75rem;
  font-weight: 900;
  color: #555;
  background: none;
  border: none;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.guest-link:hover {
  color: #000;
}

.login-error {
  margin-top: 1.5rem;
  background: #FF4500;
  color: #fff;
  border: 3px solid #000;
  padding: 0.8rem;
  font-weight: 800;
  box-shadow: 4px 4px 0px #000;
}

.spinner-small {
  width: 16px; height: 16px;
  border: 3px solid #000;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
