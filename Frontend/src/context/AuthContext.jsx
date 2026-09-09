import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import api, { TOKEN_KEY } from '../services/api.js'

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const persistSession = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
  }

  // POST /user-api/login
  const login = useCallback(async ({ email, password }) => {
    const { data } = await api.post('/user-api/login', { email, password })
    persistSession(data.token, data.payload)
    return data.payload
  }, [])

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

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  // Keep the cached session in sync after a profile update
  const updateUser = useCallback((userData) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout, updateUser }),
    [user, login, register, logout, updateUser],
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
