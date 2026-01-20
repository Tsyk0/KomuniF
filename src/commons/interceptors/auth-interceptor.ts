// src/commons/interceptors/auth-interceptor.ts
import type { 
  InternalAxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios'

/**
 * 认证相关的拦截器整合
 */

// 请求拦截器
export const authRequestInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    // 从 sessionStorage 获取 token
    const token = sessionStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 开发环境日志
    if (import.meta.env.DEV) {
      console.log('📤 发送请求:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL
      })
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
    
    // 401 未授权，清除本地存储的 token 和用户信息
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      
      // 可以在这里跳转到登录页，但为了解耦，建议在调用处处理
      // window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
}

// 统一导出
export const authInterceptor = {
  request: authRequestInterceptor,
  response: authResponseInterceptor
}