import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { clearTokens, readTokens, refreshSession, saveTokens } from '../services/api.js'

const USER_KEY = 'shopsphere_user'
const AuthContext = createContext(null)

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Keep only the fields the UI cares about, so the stored shape matches the
// login payload whether it came from /login or /profile.
const toSessionUser = (account) => ({
  _id: account._id,
  name: account.name,
  email: account.email,
  role: account.role,
  phone: account.phone,
  address: account.address,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  // False until the first server check settles, so role-gated screens don't
  // decide with a snapshot that may already be out of date. With no token there
  // is no session to verify, so we are ready straight away.
  const [authReady, setAuthReady] = useState(() => {
    const { token, refreshToken } = readTokens()
    return !token && !refreshToken
  })

  const clearSession = useCallback(() => {
    clearTokens()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const persistSession = useCallback((token, userData, refreshToken) => {
    saveTokens({ token, refreshToken })
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
  }, [])

  // Re-read the account from the backend. The cached user is a snapshot from
  // sign-in time, so a role changed in the meantime — an admin approving a
  // store application promotes a customer to "seller" — would otherwise stay
  // invisible until the user signs out and back in.
  const refreshUser = useCallback(async () => {
    // An expired access token is not a signed-out user: as long as the rotating
    // refresh token is still on disk we can silently mint a new access token and
    // keep the session alive across reloads.
    if (!readTokens().token) {
      if (readTokens().refreshToken) {
        await refreshSession()
      }
      if (!readTokens().token) {
        setUser(null)
        return null
      }
    }

    try {
      const { data } = await api.get('/user-api/profile')
      const fresh = toSessionUser(data.payload)
      localStorage.setItem(USER_KEY, JSON.stringify(fresh))
      setUser(fresh)
      return fresh
    } catch (error) {
      const status = error.response?.status
      // Dead session: expired/invalid token, deactivated or deleted account
      if (status === 401 || status === 403 || status === 404) {
        clearSession()
      }
      return null
    }
  }, [clearSession])

  // Resolve the session once on boot. Runs when either token is present, since
  // a page reload minutes later may find only the refresh token still valid.
  useEffect(() => {
    const { token, refreshToken } = readTokens()
    if (!token && !refreshToken) {
      setAuthReady(true)
      return
    }

    let cancelled = false
    refreshUser().finally(() => {
      if (!cancelled) setAuthReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [refreshUser])

  // Pick up a role change without a page reload (e.g. the admin approves the
  // store in another tab, then the seller returns to this one)
  useEffect(() => {
    const handleFocus = () => {
      refreshUser()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshUser])

  // POST /user-api/login
  const login = useCallback(
    async ({ email, password }) => {
      const { data } = await api.post('/user-api/login', { email, password })
      persistSession(data.token, data.payload, data.refreshToken)
      return data.payload
    },
    [persistSession],
  )

  // POST /user-api/register (role defaults to customer on the backend)
  const register = useCallback(async ({ name, email, password, phone, address }) => {
    const { data } = await api.post('/user-api/register', {
      name,
      email,
      password,
      phone,
      address,
    })
    return data.payload
  }, [])

  // Sign out locally first so the UI never waits on the network, then revoke the
  // refresh token server-side. Without that call a copied refresh token would
  // outlive the sign-out for its full 30-day life.
  const logout = useCallback(() => {
    const { refreshToken } = readTokens()
    clearSession()

    if (refreshToken) {
      api.post('/user-api/logout', { refreshToken }).catch(() => {})
    }
  }, [clearSession])

  // Keep the cached session in sync after a profile update
  const updateUser = useCallback((userData) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
  }, [])

  const value = useMemo(
    () => ({ user, authReady, login, register, logout, updateUser, refreshUser }),
    [user, authReady, login, register, logout, updateUser, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }
  return context
}
