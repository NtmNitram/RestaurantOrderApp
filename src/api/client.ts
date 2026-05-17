import axios from 'axios'
import { tokenStore } from './tokenStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const clearAuth = () => {
  tokenStore.set(null)
  localStorage.removeItem('role')
  localStorage.removeItem('username')
}

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    const isAuthRoute = original.url?.toLowerCase().includes('/auth/')

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true
      try {
        const { data } = await api.post<{ token: string }>('/Auth/refresh')
        tokenStore.set(data.token)
        original.headers.Authorization = `Bearer ${data.token}`
        return api(original)
      } catch {
        clearAuth()
        window.location.href = '/login'
      }
    } else if (error.response?.status === 401 && !isAuthRoute) {
      clearAuth()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
