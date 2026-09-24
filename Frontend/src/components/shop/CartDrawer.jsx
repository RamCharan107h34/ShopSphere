import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ImageOff, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useToast } from '../ui/toast.jsx'
import { formatPrice } from '../../lib/format.js'
import { isPlaceholderImage } from '../../lib/utils.js'

export function CartDrawer() {
  const { user } = useAuth()
  const { cart, loadingCart, isDrawerOpen, closeDrawer, updateQuantity, removeItem } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [busyItemId, setBusyItemId] = useState(null)

  useEffect(() => {
    if (!isDrawerOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen, closeDrawer])

  const handleUpdateQty = async (item, nextQty) => {
    if (nextQty <= 0) return handleRemove(item)
    setBusyItemId(item._id)
    try {
      await updateQuantity(item._id, nextQty)
    } catch {
      toast({ title: 'Could not update quantity', variant: 'error' })
    } finally {
      setBusyItemId(null)
    }
  }

  const handleRemove = async (item) => {
    setBusyItemId(item._id)
    try {
      await removeItem(item._id)
      toast({ title: 'Item removed from bag', variant: 'info' })
    } catch {
      toast({ title: 'Could not remove item', variant: 'error' })
    } finally {
      setBusyItemId(null)
    }
  }

  const items = cart?.items || []
  const subtotal = items.reduce((sum, item) => {
    const price = item.variantId?.price ?? item.productId?.price ?? 0
    return sum + price * item.quantity
  }, 0)

  return createPortal(
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-[#102A2A]/60 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="relative flex h-full w-full max-w-md flex-col bg-[#F7F5F0] text-[#102A2A] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#102A2A]/10 bg-[#102A2A] px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#0F766E] text-white shadow-sm">
                  <ShoppingBag className="size-4 text-[#FFE3D8]" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold">Shopping Cart</h2>
                  <p className="text-xs text-white/70">
                    {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
                  </p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close cart"
                className="flex size-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingCart ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="size-6 animate-spin text-[#0F766E]" />
                  <p className="text-sm">Loading your cart...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex size-16 items-center justify-center rounded-3xl bg-[#FFE3D8] text-[#FF6B6B] shadow-inner">
                    <ShoppingBag className="size-8" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-[#102A2A]">
                    Your cart is empty
                  </h3>
                  <p className="mt-1 max-w-xs text-sm text-[#64748B]">
                    Discover trending products, top picks, and seasonal discounts.
                  </p>
                  <button
                    onClick={() => {
                      closeDrawer()
                      navigate('/products')
                    }}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FF6B6B] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF6B6B]/25 transition hover:bg-[#ff5252]"
                  >
                    Start shopping <ArrowRight className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const product = item.productId
                    const price = item.variantId?.price ?? product?.price ?? 0
                    const image = product?.images?.[0]
                    const isBusy = busyItemId === item._id

                    return (
                      <div
                        key={item._id}
                        className="flex gap-3.5 rounded-2xl border border-[#102A2A]/5 bg-white p-3.5 shadow-sm transition hover:shadow-md"
                      >
                        {/* Thumbnail */}
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[#F7F5F0]">
                          {!isPlaceholderImage(image) ? (
                            <img
                              src={image}
                              alt={product?.title || 'Product'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <ImageOff className="size-5" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                to={`/product/${product?._id}`}
                                onClick={closeDrawer}
                                className="line-clamp-1 font-display text-sm font-semibold text-[#102A2A] transition hover:text-[#0F766E]"
                              >
                                {product?.title || 'Product'}
                              </Link>
                              <button
                                onClick={() => handleRemove(item)}
                                disabled={isBusy}
                                className="text-slate-400 transition hover:text-[#FF6B6B]"
                                aria-label="Remove item"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                            {product?.brand && (
                              <p className="text-[11px] font-medium text-[#64748B]">
                                {product.brand}
                              </p>
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-display text-sm font-bold text-[#102A2A]">
                              {formatPrice(price)}
                            </span>

                            {/* Qty Stepper */}
                            <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                              <button
                                onClick={() => handleUpdateQty(item, item.quantity - 1)}
                                disabled={isBusy}
                                aria-label={`Decrease quantity of ${product?.title || 'item'}`}
                                className="flex size-7 items-center justify-center text-slate-500 hover:text-[#102A2A]"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="min-w-6 text-center text-xs font-bold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQty(item, item.quantity + 1)}
                                disabled={isBusy}
                                aria-label={`Increase quantity of ${product?.title || 'item'}`}
                                className="flex size-7 items-center justify-center text-slate-500 hover:text-[#102A2A]"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[#102A2A]/10 bg-white p-5 shadow-lg">
                <div className="mb-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#102A2A]">{formatPrice(subtotal)}</span>
                  </div>
                  {/* The backend charges no delivery fee — it is not a hidden
                      "free" tier, so the drawer states it plainly instead of
                      inventing a threshold and a ₹99 line. */}
                  <div className="flex justify-between text-[#64748B]">
                    <span>Delivery</span>
                    <span className="font-semibold text-[#0F766E]">Free</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-display text-base font-bold text-[#102A2A]">
                    <span>Estimated Total</span>
                    <span className="text-[#0F766E]">{formatPrice(subtotal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      closeDrawer()
                      navigate('/checkout')
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B6B] py-3 text-sm font-bold text-white shadow-md shadow-[#FF6B6B]/25 transition hover:bg-[#ff5252] active:scale-[0.99]"
                  >
                    Proceed to Checkout <ArrowRight className="size-4" />
                  </button>

                  <button
                    onClick={() => {
                      closeDrawer()
                      navigate('/cart')
                    }}
                    className="w-full text-center text-xs font-semibold text-[#0F766E] transition hover:text-[#102A2A]"
                  >
                    View detailed cart & coupons
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
