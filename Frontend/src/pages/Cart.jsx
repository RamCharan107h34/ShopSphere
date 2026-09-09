import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ImageOff, Lock, Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react'
import { cn, isPlaceholderImage } from '../lib/utils.js'
import { formatPrice } from '../lib/format.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../components/ui/toast.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { CouponBox } from '../components/shop/CouponBox.jsx'
import { OrderSummary } from '../components/shop/OrderSummary.jsx'
import { ConfirmDialog } from '../components/feedback/ConfirmDialog.jsx'
import { fetchCart, removeCartItem, updateCartItem } from '../services/shop.js'
import { getErrorMessage } from '../services/api.js'

function ItemImage({ item, onError }) {
  const image = item.productId?.images?.[0]
  if (isPlaceholderImage(image)) {
    return (
      <div className="flex size-20 items-center justify-center rounded-lg bg-muted sm:size-24">
        <ImageOff className="size-6 text-muted-foreground/50" />
      </div>
    )
  }
  return (
    <img
      src={image}
      alt={item.productId?.title || 'Product'}
      loading="lazy"
      onError={onError}
      className="size-20 rounded-lg object-cover ring-1 ring-border sm:size-24"
    />
  )
}

function QuantityStepper({ value, min = 1, max, disabled, onChange, ariaLabel }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card">
      <button
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${ariaLabel}`}
        className="flex size-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-9 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={disabled || (max != null && value >= max)}
        aria-label={`Increase ${ariaLabel}`}
        className="flex size-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

export default function Cart() {
  const { user } = useAuth()
  const { setFromCart } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyItemId, setBusyItemId] = useState(null)
  const [applied, setApplied] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null) // item awaiting removal confirm

  const loadCart = useCallback(async () => {
    setLoading(true)
    try {
      const fresh = await fetchCart()
      setCart(fresh)
      setFromCart(fresh)
    } catch (error) {
      toast({ title: 'Could not load your cart', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [setFromCart, toast])

  useEffect(() => {
    if (user) loadCart()
    else {
      setCart(null)
      setLoading(false)
      setFromCart(null)
    }
  }, [user, loadCart, setFromCart])

  // Any qty change invalidates the applied coupon preview (amount changed)
  const handleQuantity = async (item, nextQty) => {
    if (!item || nextQty < 1) return
    setBusyItemId(item._id)
    try {
      const fresh = await updateCartItem(item._id, nextQty)
      setCart(fresh)
      setFromCart(fresh)
      setApplied(null)
    } catch (error) {
      toast({ title: 'Could not update quantity', description: getErrorMessage(error), variant: 'error' })
      await loadCart() // resync with the server state
    } finally {
      setBusyItemId(null)
    }
  }

  const handleRemove = async (item) => {
    setBusyItemId(item._id)
    try {
      const fresh = await removeCartItem(item._id)
      setCart(fresh)
      setFromCart(fresh)
      setApplied(null)
      toast({ title: 'Removed from cart', description: item.productId?.title || 'Item removed', variant: 'info' })
    } catch (error) {
      toast({ title: 'Could not remove item', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusyItemId(null)
      setRemoveTarget(null)
    }
  }

  const items = cart?.items || []
  const subtotal = cart?.subtotal || 0
  const discount = applied?.discount || 0
  const maxQty = (item) => (item.variantId ? item.productId?.stock || 99 : item.productId?.stock ?? 99)

  /* ---- Sign-in gate ---- */
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <ShoppingCart className="size-8 text-primary" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Sign in to view your cart</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Your cart is saved to your account. Sign in to review items and check out.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate('/login', { state: { from: '/cart' } })} size="lg">
            Sign in <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/register')}>
            Create an account
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link to="/products" className="transition-colors hover:text-primary">
              Products
            </Link>{' '}
            / <span className="text-foreground">Cart</span>
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Shopping cart</h1>
        </div>
        {!loading && items.length > 0 && (
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">
            Continue shopping →
          </Link>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="size-20 rounded-lg sm:size-24" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {/* Empty cart */}
      {!loading && items.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="size-8 text-muted-foreground" />
          </span>
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Looks like you haven't added anything yet. Explore the catalog and find something you love.
          </p>
          <Link to="/products" className="mt-2">
            <Button size="lg">
              Start shopping <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Cart content */}
      {!loading && items.length > 0 && (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: items + coupon */}
          <div className="min-w-0 space-y-5">
            <Card className="divide-y divide-border overflow-hidden">
              {items.map((item) => {
                const product = item.productId || {}
                const store = item.storeId || {}
                const stock = maxQty(item)
                const outOfStock = stock <= 0
                return (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn('flex gap-4 p-4', busyItemId === item._id && 'opacity-60')}
                  >
                    <Link to={`/product/${product._id}`} className="shrink-0" aria-label={`View ${product.title}`}>
                      <ItemImage item={item} onError={(event) => { event.currentTarget.style.display = 'none' }} />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {store.storeName && (
                            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <Store className="size-3" /> {store.storeName}
                            </p>
                          )}
                          <Link
                            to={`/product/${product._id}`}
                            className="mt-0.5 line-clamp-2 text-sm font-medium transition-colors hover:text-primary"
                          >
                            {product.title || 'Product'}
                          </Link>
                          {item.variantName && (
                            <span className="mt-1 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {item.variantName}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold">{formatPrice(item.price)}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {formatPrice(item.price)} ={' '}
                            <span className="font-semibold text-foreground">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                        <QuantityStepper
                          value={item.quantity}
                          min={1}
                          max={stock}
                          disabled={busyItemId === item._id}
                          onChange={(next) => handleQuantity(item, next)}
                          ariaLabel={product.title || 'quantity'}
                        />
                        <button
                          onClick={() => setRemoveTarget(item)}
                          disabled={busyItemId === item._id}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" /> Remove
                        </button>
                      </div>
                      {outOfStock && (
                        <p className="mt-1 text-xs font-medium text-danger-600">Out of stock — remove to continue</p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </Card>

            {/* Coupon */}
            <Card className="p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Lock className="size-4 text-primary" /> Apply coupon
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Have a promo code? Enter it below — we'll verify it against your order.
              </p>
              <div className="mt-3">
                <CouponBox subtotal={subtotal} applied={applied} onApply={setApplied} />
              </div>
            </Card>
          </div>

          {/* Right: summary */}
          <div className="lg:sticky lg:top-24">
            <OrderSummary
              itemLabel={`${cart.totalItems} ${cart.totalItems === 1 ? 'item' : 'items'}`}
              subtotal={subtotal}
              discount={discount}
            >
              <Button
                size="lg"
                className="w-full"
                onClick={() =>
                  navigate('/checkout', { state: applied ? { couponCode: applied.code } : {} })
                }
              >
                Proceed to checkout <ArrowRight className="size-4" />
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <Lock className="size-3" /> Secure checkout · Free delivery
              </p>
            </OrderSummary>
          </div>
        </div>
      )}

      {/* Confirm item removal */}
      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => handleRemove(removeTarget)}
        title="Remove this item?"
        message={`"${removeTarget?.productId?.title || 'This item'}" will be removed from your cart. You can add it back anytime.`}
        confirmLabel="Remove item"
        busy={Boolean(removeTarget && busyItemId === removeTarget._id)}
      />
    </div>
  )
}
