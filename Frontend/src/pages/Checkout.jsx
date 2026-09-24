import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Banknote, CreditCard, Landmark, Lock, ShieldCheck, Smartphone, Store } from 'lucide-react'
import { cn, isPlaceholderImage } from '../lib/utils.js'
import { formatPrice } from '../lib/format.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../components/ui/toast.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Label } from '../components/ui/Label.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { CouponBox } from '../components/shop/CouponBox.jsx'
import { OrderSummary } from '../components/shop/OrderSummary.jsx'
import { fetchCart, placeOrder } from '../services/shop.js'
import { getErrorMessage } from '../services/api.js'

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on delivery', hint: 'Pay when your order arrives', icon: Banknote },
  { value: 'CARD', label: 'Credit / Debit card', hint: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { value: 'UPI', label: 'UPI', hint: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { value: 'NET_BANKING', label: 'Net banking', hint: 'All major banks', icon: Landmark },
]

const validateAddress = (form) => {
  const errors = {}
  if (!form.street.trim()) errors.street = 'Street address is required'
  if (!form.city.trim()) errors.city = 'City is required'
  if (!form.state.trim()) errors.state = 'State is required'
  if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode'
  if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Enter a valid 10-digit phone number'
  return errors
}

function SectionHeading({ step, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
        {step}
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function Checkout() {
  const { user } = useAuth()
  const { setFromCart } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const prefillCode = location.state?.couponCode || null

  const [form, setForm] = useState(() => {
    const saved = user?.address && typeof user.address === 'object' ? user.address : {}
    return {
      street: saved.street || '',
      city: saved.city || '',
      state: saved.state || '',
      pincode: saved.pincode || '',
      phone: user?.phone || '',
    }
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [applied, setApplied] = useState(null)

  const items = cart?.items || []
  const subtotal = cart?.subtotal || 0

  // Load the cart (fresh from the server)
  useEffect(() => {
    let cancelled = false
    if (!user) return
    setLoading(true)
    fetchCart()
      .then((fresh) => {
        if (cancelled) return
        setCart(fresh)
        setFromCart(fresh)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [user, setFromCart])

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    if (touched[name]) {
      setErrors((current) => ({ ...current, [name]: validateAddress({ ...form, [name]: value })[name] || '' }))
    }
  }

  const handleBlur = (name) => {
    setTouched((current) => ({ ...current, [name]: true }))
    setErrors((current) => ({ ...current, [name]: validateAddress(form)[name] || '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateAddress(form)
    setErrors(validation)
    setTouched({ street: true, city: true, state: true, pincode: true, phone: true })
    if (Object.keys(validation).length > 0) return

    setPlacing(true)
    try {
      const order = await placeOrder({
        shippingAddress: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          phone: form.phone.trim(),
        },
        paymentMethod,
        couponCode: applied?.code,
      })
      setFromCart(null) // server cleared the cart
      toast({ title: 'Order placed 🎉', description: `Order ${order.orderNumber} confirmed`, variant: 'success' })
      navigate(`/order-confirmation/${order._id}`, { state: { order } })
    } catch (error) {
      toast({ title: 'Could not place your order', description: getErrorMessage(error), variant: 'error' })
      // Stock may have changed — resync what the server sees
      try {
        const fresh = await fetchCart()
        setCart(fresh)
        setFromCart(fresh)
      } catch {
        /* ignore */
      }
    } finally {
      setPlacing(false)
    }
  }

  /* ---- Sign-in gate ---- */
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-violet-50">
          <Lock className="size-7 text-violet-600" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Sign in to check out</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-500">
          You need an account to place an order. Sign in or create one in a moment.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate('/login', { state: { from: '/cart' } })} size="lg">
            Sign in
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/register')}>
            Create an account
          </Button>
        </div>
      </div>
    )
  }

  /* ---- Empty cart after load ---- */
  if (!loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16">
          <p className="font-semibold">Your cart is empty</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Add something to your cart before checking out.
          </p>
          <Link to="/products" className="mt-6 inline-block">
            <Button size="lg">Browse products</Button>
          </Link>
        </div>
      </div>
    )
  }

  const fieldClass = (name) =>
    cn(errors[name] && 'border-red-400 focus-visible:ring-red-300')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Heading */}
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/cart" className="transition-colors hover:text-violet-600">
            Cart
          </Link>{' '}
          / <span className="text-slate-900">Checkout</span>
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]" noValidate>
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          {/* 1 · Delivery address */}
          <Card className="p-5 sm:p-6">
            <SectionHeading step={1} title="Delivery address" subtitle="Where should we send your order?" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="street">Street address *</Label>
                <Input
                  id="street"
                  name="street"
                  value={form.street}
                  onChange={(event) => setField('street', event.target.value)}
                  onBlur={() => handleBlur('street')}
                  placeholder="House number, building, street, area"
                  aria-invalid={Boolean(errors.street)}
                  className={cn('mt-1.5', fieldClass('street'))}
                />
                {errors.street && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.street}</p>
                )}
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={(event) => setField('city', event.target.value)}
                  onBlur={() => handleBlur('city')}
                  placeholder="City"
                  aria-invalid={Boolean(errors.city)}
                  className={cn('mt-1.5', fieldClass('city'))}
                />
                {errors.city && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.city}</p>
                )}
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={form.state}
                  onChange={(event) => setField('state', event.target.value)}
                  onBlur={() => handleBlur('state')}
                  placeholder="State"
                  aria-invalid={Boolean(errors.state)}
                  className={cn('mt-1.5', fieldClass('state'))}
                />
                {errors.state && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.state}</p>
                )}
              </div>
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  inputMode="numeric"
                  value={form.pincode}
                  onChange={(event) => setField('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={() => handleBlur('pincode')}
                  placeholder="6-digit pincode"
                  aria-invalid={Boolean(errors.pincode)}
                  className={cn('mt-1.5', fieldClass('pincode'))}
                />
                {errors.pincode && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.pincode}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
                  onBlur={() => handleBlur('phone')}
                  placeholder="10-digit mobile number"
                  aria-invalid={Boolean(errors.phone)}
                  className={cn('mt-1.5', fieldClass('phone'))}
                />
                {errors.phone && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </Card>

          {/* 2 · Payment method */}
          <Card className="p-5 sm:p-6">
            <SectionHeading step={2} title="Payment method" subtitle="Demo checkout — no real payment is processed" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                const selected = paymentMethod === method.value
                return (
                  <label
                    key={method.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all',
                      selected
                        ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-200'
                        : 'border-slate-200 hover:border-violet-200 hover:bg-violet-50/50',
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={selected}
                      onChange={() => setPaymentMethod(method.value)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                        selected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{method.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{method.hint}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {paymentMethod !== 'COD' && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="size-3.5 text-emerald-700" />
                This is a demo: the order will be recorded as paid without a real gateway.
              </p>
            )}
          </Card>

          {/* 3 · Review items */}
          <Card className="p-5 sm:p-6">
            <SectionHeading step={3} title={`Review items (${cart?.totalItems || 0})`} />
            {loading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200">
                {items.map((item) => {
                  const product = item.productId || {}
                  const store = item.storeId || {}
                  return (
                    <li key={item._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="relative shrink-0">
                        {!isPlaceholderImage(product.images?.[0]) ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none'
                            }}
                            className="size-14 rounded-lg object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="size-14 rounded-lg bg-slate-100" />
                        )}
                        <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          {store.storeName && (
                            <>
                              <Store className="size-3" /> {store.storeName} ·
                            </>
                          )}
                          {item.variantName && <span>{item.variantName} · </span>}
                          <span>{formatPrice(item.price)} each</span>
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Right: summary + place order */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <OrderSummary
            itemLabel={`${cart?.totalItems || 0} ${cart?.totalItems === 1 ? 'item' : 'items'}`}
            subtotal={subtotal}
            discount={applied?.discount || 0}
            extraRows={[
              {
                label: 'Payment',
                value: PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label || paymentMethod,
              },
            ]}
          >
            <Button type="submit" size="lg" className="w-full" loading={placing} disabled={loading || items.length === 0}>
              {placing ? 'Placing your order…' : `Place order · ${formatPrice(Math.max(0, subtotal - (applied?.discount || 0)))}`}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <Lock className="size-3" /> By placing this order you agree to the marketplace terms.
            </p>
          </OrderSummary>

          {/* Coupon (revalidated against the final amount) */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="size-4 text-violet-600" /> Coupon
            </h2>
            <div className="mt-3">
              <CouponBox
                subtotal={subtotal}
                applied={applied}
                onApply={setApplied}
                autoCode={applied ? null : prefillCode}
              />
            </div>
          </Card>

          <Link
            to="/cart"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-violet-600"
          >
            <ArrowLeft className="size-4" /> Back to cart
          </Link>
        </div>
      </form>
    </div>
  )
}
