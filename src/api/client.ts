// Este archivo es como el "servicio base" de Angular.
// Configura axios una sola vez con la URL base.
// Todos los demás archivos de api/ lo importan.

import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient
