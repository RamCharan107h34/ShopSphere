import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api.js'
import { useAuth } from './AuthContext.jsx'

// Lightweight cart badge state: keeps the navbar item count in sync
// across pages without refetching the full cart everywhere.
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  // Re-read the count whenever the session changes (login/logout)
  const refreshCount = useCallback(async () => {
    if (!user) {
      setCount(0)
      return
    }
    try {
      const { data } = await api.get('/cart-api/cart')
      setCount(data.payload?.totalItems || 0)
    } catch {
      setCount(0)
    }
  }, [user])

  useEffect(() => {
    refreshCount()
  }, [refreshCount])

  // Direct sync when a caller already holds a fresh cart payload
  const setFromCart = useCallback((cart) => {
    setCount(cart?.totalItems || 0)
  }, [])

  const value = useMemo(
    () => ({ count, refreshCount, setFromCart }),
    [count, refreshCount, setFromCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside a <CartProvider>')
  }
  return context
}
