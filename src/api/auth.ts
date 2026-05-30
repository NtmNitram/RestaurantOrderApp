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

export async function refresh(): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>('/Auth/refresh')
  return res.data
}

export async function logout(): Promise<void> {
  await api.post('/Auth/logout')
}
