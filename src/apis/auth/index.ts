// src/apis/auth/index.ts
import service from '../service'
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  RegisterResponse, 
  CheckTokenResponse 
} from '@/types/dto/auth'

/**
 * 用户登录
 * @param {LoginRequest} data 登录数据
 * @returns {Promise<LoginResponse>}
 */
export function loginApi(data: LoginRequest): Promise<LoginResponse> {
  return service({
    url: '/user/loginCheck',
    method: 'post',
    data,
    withCredentials: true
  })

}
// 新增：Token验证API
export function checkTokenApi(_token?: string): Promise<CheckTokenResponse> {
  return service({
    url: '/user/checkToken',
    method: 'get',
    withCredentials: true
  })
}

/**
 * 用户注册
 * @param {RegisterRequest} data 注册数据
 * @returns {Promise<RegisterResponse>}
 */
export function registerApi(data: RegisterRequest): Promise<RegisterResponse> {
  return service({
    url: '/user/insertUser',
    method: 'post',
    data,
    withCredentials: true
  })
}

// 保持原有的 authApi 对象导出以兼容现有代码
export const authApi = {
  login: loginApi,
  register: registerApi
}

// 默认导出
export default authApi