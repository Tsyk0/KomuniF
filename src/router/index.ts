// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/LoginView.vue'),
    props: { defaultTab: 'register' }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/LoginView.vue'),
    props: { defaultTab: 'forgot-password' }
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true }  // 需要登录
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫 - 检查登录状态 + access token 有效性
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 不需要登录的页面，直接放行
  if (!to.meta.requiresAuth) {
    next()
    return
  }

  // 检查本地是否有 access token
  const accessToken = localStorage.getItem('access_token')
  if (!accessToken) {
    authStore.clearStorage()
    next('/') // 没有 token，直接跳转登录
    return
  }

  // 调用 /user/checkToken 确保 access token 有效（如有需要会自动续签）
  const ok = await authStore.ensureAccessTokenValid()
  if (ok) {
    next()
  } else {
    next('/') // token 无效或刷新失败，要求重新登录
  }
})

export default router