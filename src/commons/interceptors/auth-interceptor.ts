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
      ;(config.headers as any).Authorization = `Bearer ${accessToken}`
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
    
    // 401 未授权，清除本地存储的用户信息和访问 token
    if (error.response?.status === 401) {
      sessionStorage.removeItem('user')
      localStorage.removeItem('access_token')
      
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