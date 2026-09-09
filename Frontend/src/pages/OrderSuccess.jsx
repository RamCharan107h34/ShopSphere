import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { formatPrice } from '../lib/format.js'
import { isPlaceholderImage } from '../lib/utils.js'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { fetchOrder } from '../services/shop.js'

const PAYMENT_LABELS = {
  COD: 'Cash on delivery',
  CARD: 'Card',
  UPI: 'UPI',
  NET_BANKING: 'Net banking',
}

const STATUS_STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function OrderSuccess() {
  const { id } = useParams()
  const location = useLocation()

  // Prefer the order handed over right after checkout; otherwise re-fetch
  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!order)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (order) return
    let cancelled = false
    fetchOrder(id)
      .then((fetched) => !cancelled && setOrder(fetched))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find that order for your account.</p>
        <Link to="/products" className="mt-8 inline-block">
          <Button size="lg">
            Continue shopping <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    )
  }

  const vendorOrders = order.vendorOrders || []
  const itemsCount = vendorOrders.reduce((acc, vo) => acc + vo.items.reduce((n, item) => n + item.quantity, 0), 0)
  const statusIndex = STATUS_STEPS.indexOf(order.overallStatus)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Celebration header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex flex-col items-center text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
          className="flex size-20 items-center justify-center rounded-full bg-success/15"
        >
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <CheckCircle2 className="size-11 text-success-700" />
          </motion.span>
        </motion.span>

        <h1 className="mt-5 text-3xl font-bold tracking-tight">Order placed successfully!</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Thank you for shopping with us. We've sent a confirmation and will keep you posted on every step.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="success" className="px-3 py-1 text-sm">
            <PackageCheck className="size-3.5" /> {order.orderNumber}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <CalendarDays className="size-3.5" /> {formatDate(order.createdAt)}
          </Badge>
        </div>
      </motion.div>

      {/* Order facts */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Package className="size-3.5" /> Items
          </p>
          <p className="mt-1.5 text-lg font-bold">
            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CreditCard className="size-3.5" /> Payment
          </p>
          <p className="mt-1.5 text-lg font-bold">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <BadgeCheck className="size-3.5" /> Status
          </p>
          <p className="mt-1.5 text-lg font-bold capitalize">{order.overallStatus}</p>
        </Card>
      </div>

      {/* Items + amounts */}
      <div className="mt-8 grid items-start gap-6 md:grid-cols-[1fr_260px]">
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">Your order</h2>
          <ul className="mt-4 space-y-4">
            {vendorOrders.map((vendorOrder) =>
              vendorOrder.items.map((item) => (
                <li key={item._id || `${vendorOrder._id}-${item.productId}`} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {!isPlaceholderImage(item.image) ? (
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                        className="size-14 rounded-lg object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-lg bg-muted">
                        <ShoppingBag className="size-5 text-muted-foreground/60" />
                      </div>
                    )}
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.productId}`} className="line-clamp-1 text-sm font-medium hover:text-primary">
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.variantName ? `${item.variantName} · ` : ''}
                      {formatPrice(item.price)} each
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                </li>
              )),
            )}
          </ul>
        </Card>

        {/* Amounts */}
        <Card className="p-5">
          <h2 className="font-semibold">Amount paid</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(order.totalAmount + (order.discountAmount || 0))}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-success-700">
                <span>Coupon {order.couponCode && `(${order.couponCode})`}</span>
                <span>−{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span className="text-success-700">Free</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-border pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Delivery address */}
      <Card className="mt-4 flex items-start gap-3 p-5 sm:p-6">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <MapPin className="size-4.5 text-primary" />
        </span>
        <div>
          <h2 className="font-semibold">Delivering to</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.pincode}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
        </div>
      </Card>

      {/* What happens next */}
      <Card className="mt-4 p-5 sm:p-6">
        <h2 className="font-semibold">What happens next?</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {STATUS_STEPS.map((step, index) => {
            const reached = statusIndex >= index
            return (
              <li key={step} className="flex items-center gap-2.5 text-sm">
                <span
                  className={
                    reached
                      ? 'flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success-700'
                      : 'flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
                  }
                >
                  {index === STATUS_STEPS.length - 1 ? (
                    <Truck className="size-3.5" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </span>
                <span className={reached ? 'font-medium capitalize' : 'capitalize text-muted-foreground'}>{step}</span>
              </li>
            )
          })}
        </ol>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/products">
          <Button size="lg">
            Continue shopping <ArrowRight className="size-4" />
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" size="lg">
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  )
}
