import axios from 'axios'

const TOKEN_KEY = 'auth_token'
const EXPIRES_KEY = 'auth_expires_at'

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY))
  if (!token || (expiresAt && Date.now() >= expiresAt)) return null
  return token
}

export function getTokenExpiry() {
  return Number(localStorage.getItem(EXPIRES_KEY)) || null
}

export function setToken(token, expiresInSeconds) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresInSeconds * 1000))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRES_KEY)
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 90_000, // chat answers can take a while
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// AuthContext registers a handler so any 401 logs the user out.
let unauthorizedHandler = null
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from login means wrong credentials, not an expired session.
    const isAuthCall = /\/auth\/(login|register)$/.test(error.config?.url ?? '')
    if (error.response?.status === 401 && !isAuthCall) {
      clearToken()
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

export default client
