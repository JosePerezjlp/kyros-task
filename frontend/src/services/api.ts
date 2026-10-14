import axios, { AxiosError } from 'axios'

export const TOKEN_KEY = 'taskmanager.token'
export const USER_KEY = 'taskmanager.user'

// Same-origin '/api' works both behind CloudFront and through the Vite dev proxy
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/')
    // Expired or invalid session: drop it and send the user to the login page
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

/** Extracts a user-friendly message from an API error. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Inténtalo de nuevo.'
    const data = error.response?.data as { message?: string; errors?: Array<{ field: string; message: string }> } | undefined
    if (data?.errors?.length) {
      return data.errors.map((e) => `${e.field}: ${e.message}`).join(' · ')
    }
    if (data?.message) return data.message
    if (!error.response) return 'No se pudo conectar con el servidor.'
  }
  return 'Ocurrió un error inesperado.'
}
