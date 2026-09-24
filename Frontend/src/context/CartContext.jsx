import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api.js'
import { useAuth } from './AuthContext.jsx'

/**
 * Cart state for the whole app.
 *
 * Two jobs, one store:
 *   1. the navbar/drawer badge count (`count`)
 *   2. the slide-out cart drawer (`cart`, `isDrawerOpen`, open/close)
 *
 * Every mutation is **optimistic** — the UI updates immediately, the request
 * runs in the background, and a failure rolls the previous snapshot back and
 * rethrows so the caller can show a toast. Without that, every "+" in the
 * drawer would freeze until the round trip finished.
 */
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)
  const [count, setCount] = useState(0)
  const [loadingCart, setLoadingCart] = useState(false)
  const [isDrawerOpen, setDrawerOpen] = useState(false)

  // Mutations roll back to the last known-good cart, so keep it in a ref
  // (a state snapshot would be stale inside the async handlers).
  const snapshotRef = useRef(null)

  const applyCart = useCallback((next) => {
    setCart(next || null)
    setCount(next?.totalItems || 0)
    snapshotRef.current = next || null
  }, [])

  const refresh = useCallback(async () => {
    if (!user) {
      applyCart(null)
      return null
    }
    setLoadingCart(true)
    try {
      const { data } = await api.get('/cart-api/cart')
      applyCart(data.payload)
      return data.payload
    } catch {
      applyCart(null)
      return null
    } finally {
      setLoadingCart(false)
    }
  }, [user, applyCart])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Signing out empties the badge and closes the drawer with the session
  useEffect(() => {
    if (!user) setDrawerOpen(false)
  }, [user])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), [])

  /** Sync directly from a cart payload a caller already holds. */
  const setFromCart = useCallback(
    (next) => {
      applyCart(next)
    },
    [applyCart],
  )

  /** Kept for pages that only need the badge refreshed after their own write. */
  const refreshCount = refresh

  // ---- Mutations (optimistic) ------------------------------------------

  /**
   * `product` is optional metadata from the card/page that triggered the add:
   * passing it lets the drawer render the new line instantly instead of
   * waiting for the server round trip.
   */
  const addItem = useCallback(
    async ({ productId, variantId = null, quantity = 1, product = null }) => {
      const previous = snapshotRef.current

      if (product) {
        const variant = variantId ? product.variants?.find((v) => v._id === variantId) : null
        const unitPrice = Number(variant?.price ?? product.price ?? 0)
        const line = {
          _id: `optimistic-${Date.now()}`,
          productId: product,
          variantId: variant || null,
          variantName: variant?.name || null,
          quantity,
          price: unitPrice,
        }
        const items = [...(previous?.items || []), line]
        setCart({ ...previous, items, totalItems: (previous?.totalItems || 0) + quantity })
        setCount((current) => current + quantity)
      } else {
        setCount((current) => current + quantity)
      }

      try {
        const { data } = await api.post('/cart-api/cart', { productId, quantity, variantId })
        applyCart(data.payload)
        return data.payload
      } catch (error) {
        // The server rejected it (out of stock, unauthenticated, …) — undo
        if (previous) applyCart(previous)
        else setCount((current) => Math.max(0, current - quantity))
        throw error
      }
    },
    [applyCart],
  )

  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      const previous = snapshotRef.current
      if (previous?.items) {
        const items = previous.items.map((item) =>
          item._id === itemId ? { ...item, quantity } : item,
        )
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
        setCart({ ...previous, items, totalItems })
        setCount(totalItems)
      }

      try {
        const { data } = await api.put(`/cart-api/cart/${itemId}`, { quantity })
        applyCart(data.payload)
        return data.payload
      } catch (error) {
        if (previous) applyCart(previous)
        throw error
      }
    },
    [applyCart],
  )

  const removeItem = useCallback(
    async (itemId) => {
      const previous = snapshotRef.current
      if (previous?.items) {
        const items = previous.items.filter((item) => item._id !== itemId)
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
        setCart({ ...previous, items, totalItems })
        setCount(totalItems)
      }

      try {
        const { data } = await api.delete(`/cart-api/cart/${itemId}`)
        applyCart(data.payload)
        return data.payload
      } catch (error) {
        if (previous) applyCart(previous)
        throw error
      }
    },
    [applyCart],
  )

  const clearCart = useCallback(async () => {
    if (!user) return
    const { data } = await api.delete('/cart-api/cart')
    applyCart({ ...(data.payload || {}), items: [], totalItems: 0 })
  }, [user, applyCart])

  const value = useMemo(
    () => ({
      cart,
      count,
      loadingCart,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      refresh,
      refreshCount,
      setFromCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      cart,
      count,
      loadingCart,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      refresh,
      refreshCount,
      setFromCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ],
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
