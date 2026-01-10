import axios from 'axios'

// 添加调试信息
console.log('🔧 检查环境变量加载:')
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('运行模式:', import.meta.env.MODE)
console.log('开发环境:', import.meta.env.DEV)

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // 使用环境变量
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 修改：从 sessionStorage 读取 token
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求日志
    console.log('📤 发送请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL
    })
    
    return config
  },
  (error) => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('✅ 收到响应:', {
      url: response.config.url,
      status: response.status
    })
    return response.data
  },
  (error) => {
    console.error('❌ 请求失败:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    })
    
    // 如果是 401 未授权，清除 token
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    }
    
    return Promise.reject(error)
  }
)

export default api