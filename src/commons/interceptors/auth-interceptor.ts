// src/commons/interceptors/auth-interceptor.ts
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError
} from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

/**
 * 认证相关的拦截器整合
 */

// 请求拦截器
export const authRequestInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    // 开发环境日志
    if (import.meta.env.DEV) {
      console.log('📤 发送请求:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL
      })
    }

    // 从本地存储中读取访问 token，并统一添加到 Authorization 头
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      // AxiosRequestHeaders 在运行时是普通对象，这里直接赋值即可
      config.headers['Authorization'] = `Bearer ${accessToken}`
    }

    return config
  },

  onRejected: (error: any) => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
}

// 响应拦截器
export const authResponseInterceptor = {
  onFulfilled: (response: AxiosResponse) => {
    // 开发环境日志
    if (import.meta.env.DEV) {
      console.log('✅ 收到响应:', {
        url: response.config.url,
        status: response.status,
        data: response.data

      })
    }
    return response.data
  },

  onRejected: (error: AxiosError) => {
    console.error('❌ 请求失败:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    })

    // 401 未授权 / Token 失效：清理登录状态并跳转到登录页
    if (error.response?.status === 401) {
      try {
        const authStore = useAuthStore()
        authStore.logout()
      } catch (e) {
        // 如果在极少数场景下 store 未就绪，至少清理本地存储
        sessionStorage.removeItem('user')
        localStorage.removeItem('access_token')
      }

      // 避免重复跳转：仅在当前路由不是登录页时执行
      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' }).catch(() => {
          // 忽略重复导航等非致命错误
        })
      }
    }

    return Promise.reject(error)
  }
}

// 统一导出
export const authInterceptor = {
  request: authRequestInterceptor,
  response: authResponseInterceptor
}