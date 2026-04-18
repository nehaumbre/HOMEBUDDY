import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth, googleProvider } from '@/firebase'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth'
import { useDataStore } from './data'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  // Called once from main.js — listens for auth state changes
  function init() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        user.value = firebaseUser
        loading.value = false

        if (firebaseUser) {
          const dataStore = useDataStore()
          await dataStore.init(firebaseUser.uid)
        } else {
          const dataStore = useDataStore()
          dataStore.reset()
        }
        resolve(firebaseUser)
      })
    })
  }

  async function signUpWithEmail(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      user.value = result.user
    } catch (err) {
      console.error('Email sign-up error:', err)
      throw err
    }
  }

  async function signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      user.value = result.user
    } catch (err) {
      console.error('Email sign-in error:', err)
      throw err
    }
  }

  async function continueAsGuest() {
    try {
      const result = await signInAnonymously(auth)
      user.value = result.user
    } catch (err) {
      console.error('Anonymous sign-in error:', err)
      throw err
    }
  }

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      user.value = result.user
    } catch (err) {
      console.error('Google sign-in error:', err)
      throw err
    }
  }

  async function signOut() {
    await firebaseSignOut(auth)
    user.value = null
  }

  return { 
    user, loading, init, 
    signInWithGoogle, 
    signUpWithEmail, 
    signInWithEmail, 
    continueAsGuest,
    signOut 
  }
})
