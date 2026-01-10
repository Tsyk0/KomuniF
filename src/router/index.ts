import { createRouter, createWebHistory } from 'vue-router'

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

// 路由守卫 - 检查登录状态
router.beforeEach((to, from, next) => {
  // 修改：从 sessionStorage 读取 token
  const token = sessionStorage.getItem('token')
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !token) {
    next('/')  // 跳转到登录页
  } else {
    next()
  }
})

export default router