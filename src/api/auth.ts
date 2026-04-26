import api from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  token: string
  role: string
  username: string
}

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>('/Auth/login', data)
  return res.data
}
