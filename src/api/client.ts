import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const clearAuth = () => {
  localStorage.removeItem('token')
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
        localStorage.setItem('token', data.token)
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
