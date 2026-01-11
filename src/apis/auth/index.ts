// src/apis/auth/index.ts
import service from '../service'
import type { LoginRequest, RegisterRequest } from '@/types/flow/auth.request'
import type { LoginResponse, RegisterResponse } from '@/types/flow/auth.response'

/**
 * 用户登录
 * @param {LoginRequest} data 登录数据
 * @returns {Promise<LoginResponse>}
 */
export function loginApi(data: LoginRequest): Promise<LoginResponse> {
  return service({
    url: '/user/loginCheck',
    method: 'post',
    data
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
    data
  })
}

// 保持原有的 authApi 对象导出以兼容现有代码
export const authApi = {
  login: loginApi,
  register: registerApi
}

// 默认导出
export default authApi