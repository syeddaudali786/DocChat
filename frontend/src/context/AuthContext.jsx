import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { clearToken, getToken, getTokenExpiry, onUnauthorized, setToken } from '../api/client'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const toast = useToast()
  const [user, setUser] = useState(null)
  // 'loading' while checking a saved token, 'error' if the API is unreachable
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'anonymous'))
  const userRef = useRef(null)
  userRef.current = user

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const loadUser = useCallback(async () => {
    if (!getToken()) return setStatus('anonymous')
    setStatus('loading')
    try {
      setUser(await authApi.getMe())
      setStatus('authenticated')
    } catch (error) {
      if (error.response?.status === 401) logout()
      else setStatus('error')
    }
  }, [logout])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Any 401 from the API (expired or revoked token) signs the user out.
  useEffect(() => {
    onUnauthorized(() => {
      if (userRef.current) toast.info('Your session has expired. Please sign in again.')
      logout()
    })
    return () => onUnauthorized(null)
  }, [logout, toast])

  // Also sign out when the token's lifetime runs out while the tab is open.
  useEffect(() => {
    const expiry = getTokenExpiry()
    if (!user || !expiry) return
    const timer = setTimeout(() => {
      toast.info('Your session has expired. Please sign in again.')
      logout()
    }, Math.max(expiry - Date.now(), 0))
    return () => clearTimeout(timer)
  }, [user, logout, toast])

  const login = useCallback(async (email, password) => {
    const { access_token, expires_in } = await authApi.login(email, password)
    setToken(access_token, expires_in)
    const me = await authApi.getMe()
    setUser(me)
    setStatus('authenticated')
    return me
  }, [])

  const register = useCallback(
    async (email, password) => {
      await authApi.register(email, password)
      try {
        return await login(email, password)
      } catch (error) {
        error.afterRegister = true // account exists; only the automatic sign-in failed
        throw error
      }
    },
    [login],
  )

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, retry: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
