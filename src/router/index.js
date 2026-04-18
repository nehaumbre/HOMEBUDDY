import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    // Redirect to home if already logged in
    beforeEnter: (to, from, next) => {
      const auth = useAuthStore()
      if (auth.user) next({ name: 'home' })
      else next()
    },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/AppView.vue'),
    // Require authentication
    beforeEnter: (to, from, next) => {
      const auth = useAuthStore()
      if (!auth.user) next({ name: 'login' })
      else next()
    },
  },
  // Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
