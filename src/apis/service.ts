// File: src/apis/service.ts
// src/apis/service.ts
import axios from 'axios'
import { authInterceptor } from '@/commons/interceptors'

// 调试信息（保持和原来一样）
console.log('🔧 检查环境变量加载:')
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('运行模式:', import.meta.env.MODE)
console.log('开发环境:', import.meta.env.DEV)

// 确保全局携带 cookie（HttpOnly 登录态）
axios.defaults.withCredentials = true

// 创建 axios 实例（配置和原来一样）
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 应用请求拦截器
service.interceptors.request.use(
  authInterceptor.request.onFulfilled,
  authInterceptor.request.onRejected
)

// 应用响应拦截器
service.interceptors.response.use(
  authInterceptor.response.onFulfilled,
  authInterceptor.response.onRejected
)

export default service