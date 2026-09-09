import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Star,
  Store,
  Truck,
  XCircle,
} from 'lucide-react'
import { cn, isPlaceholderImage } from '../../lib/utils.js'
import { formatPrice } from '../../lib/format.js'
import {
  ORDER_META,
  RETURN_REASONS,
  SUBORDER_META,
  canCancelOrder,
  returnFlowSteps,
  vendorFlowSteps,
} from '../../lib/status.js'
import { fetchOrder } from '../../services/shop.js'
import { cancelMyOrder, fetchMyReturns, requestReturn, submitReview } from '../../services/account.js'
import { getErrorMessage } from '../../services/api.js'
import { useToast } from '../../components/ui/toast.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Label } from '../../components/ui/Label.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { Textarea } from '../../components/ui/Textarea.jsx'
import { FlowSteps } from '../../components/account/FlowSteps.jsx'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'

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

const PAYMENT_LABELS = {
  COD: 'Cash on delivery',
  CARD: 'Card',
  UPI: 'UPI',
  NET_BANKING: 'Net banking',
}

export default function OrderDetails() {
  const { orderId } = useParams()
  const { toast } = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [returns, setReturns] = useState([])
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Return request modal state (one product at a time)
  const [returnItem, setReturnItem] = useState(null) // { vendorOrder, item }
  const [returnQty, setReturnQty] = useState(1)
  const [returnReason, setReturnReason] = useState('')
  const [returnNote, setReturnNote] = useState('')
  const [submittingReturn, setSubmittingReturn] = useState(false)

  // Review modal state (one product at a time)
  const [reviewItem, setReviewItem] = useState(null) // { vendorOrder, item }
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const [orderData, returnsData] = await Promise.all([fetchOrder(orderId), fetchMyReturns()])
      setOrder(orderData)
      setReturns(returnsData || [])
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) setNotFound(true)
      else toast({ title: 'Could not load order', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  useEffect(() => {
    load()
  }, [load])

  // Returns belonging to this order, keyed by sub-order id
  const orderReturns = useMemo(
    () => returns.filter((r) => r.orderId?.toString() === orderId),
    [returns, orderId],
  )
  const returnsBySubOrder = useMemo(() => {
    const map = new Map()
    for (const item of orderReturns) map.set(item.subOrderId?.toString(), item)
    return map
  }, [orderReturns])

  const openReturnModal = (vendorOrder, item) => {
    setReturnItem({ vendorOrder, item })
    setReturnQty(item.quantity)
    setReturnReason('')
    setReturnNote('')
  }

  const submitReturn = async () => {
    if (!returnReason) {
      toast({ title: 'Pick a reason', description: 'Choose why you are returning this item.', variant: 'error' })
      return
    }
    setSubmittingReturn(true)
    try {
      await requestReturn({
        orderId,
        subOrderId: returnItem.vendorOrder._id,
        productId: returnItem.item.productId,
        quantity: returnQty,
        reason: returnReason,
        description: returnNote.trim(),
      })
      toast({ title: 'Return request submitted', description: 'The seller will review it shortly.', variant: 'success' })
      setReturnItem(null)
      load()
    } catch (error) {
      toast({ title: 'Could not submit return', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSubmittingReturn(false)
    }
  }

  const openReviewModal = (vendorOrder, item) => {
    setReviewItem({ vendorOrder, item })
    setReviewRating(5)
    setReviewComment('')
  }

  const submitReviewAction = async () => {
    setSubmittingReview(true)
    try {
      await submitReview({
        orderId,
        productId: reviewItem.item.productId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      })
      toast({ title: 'Review submitted ⭐', description: 'Thanks for rating this product!', variant: 'success' })
      setReviewItem(null)
      load()
    } catch (error) {
      toast({ title: 'Could not submit review', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleCancelOrder = async () => {
    setCancelling(true)
    try {
      await cancelMyOrder(order._id)
      toast({ title: 'Order cancelled', description: 'Items were restored to stock.', variant: 'success' })
      setCancelOpen(false)
      load()
    } catch (error) {
      toast({ title: 'Could not cancel order', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setCancelling(false)
    }
  }

  /* ---------- States ---------- */
  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <h2 className="text-xl font-bold">Order not found</h2>
        <p className="text-sm text-muted-foreground">This order doesn't exist or isn't linked to your account.</p>
        <Link to="/account/orders">
          <Button variant="outline">Back to my orders</Button>
        </Link>
      </div>
    )
  }

  const vendorOrders = order.vendorOrders || []
  const itemCount = vendorOrders.reduce((acc, vo) => acc + vo.items.reduce((n, item) => n + item.quantity, 0), 0)
  const cancellable = canCancelOrder(order)

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to my orders
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{order.orderNumber}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" /> Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.overallStatus} meta={ORDER_META} />
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="size-3.5" /> Deliver to
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">
              {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.pincode}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CreditCard className="size-3.5" /> Payment
            </p>
            <p className="mt-1.5 text-sm">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
            <p className="mt-0.5 text-sm capitalize text-muted-foreground">{order.paymentStatus}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Store className="size-3.5" /> Summary
            </p>
            <p className="mt-1.5 text-sm">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
            <p className="text-sm">
              Total:{' '}
              <span className="font-bold">
                {formatPrice(order.totalAmount)}
                {order.discountAmount > 0 && (
                  <span className="ml-1 font-normal text-success-700">(−{formatPrice(order.discountAmount)} coupon)</span>
                )}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Vendor sub-orders */}
      {vendorOrders.map((vendorOrder, index) => {
        const steps = vendorFlowSteps(vendorOrder.status)
        const returnInfo = returnsBySubOrder.get(vendorOrder._id?.toString())
        return (
          <motion.div
            key={vendorOrder._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <Card className="overflow-hidden">
              {/* Store header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Store className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{vendorOrder.storeId?.storeName || 'ShopSphere seller'}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendorOrder.items.reduce((n, item) => n + item.quantity, 0)} items · {formatPrice(vendorOrder.subtotal)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={vendorOrder.status} meta={SUBORDER_META} />
              </div>

              <div className="grid gap-6 p-5 md:grid-cols-[1fr_230px]">
                {/* Items */}
                <ul className="space-y-4">
                  {vendorOrder.items.map((item) => {
                    const canReturn = vendorOrder.status === 'delivered'
                    return (
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
                              <Store className="size-5 text-muted-foreground/50" />
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
                          {item.quantity > 1 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Line total: <span className="font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {canReturn && vendorOrder.status === 'delivered' && !returnInfo && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewModal(vendorOrder, item)}
                            >
                              <Star className="size-3.5" /> Review
                            </Button>
                          )}
                          {canReturn && vendorOrder.status === 'delivered' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReturnModal(vendorOrder, item)}
                            >
                              <RotateCcw className="size-3.5" /> Return
                            </Button>
                          )}
                          <p className="w-20 text-right text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {/* Status / timeline column */}
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  {steps.length > 0 ? (
                    <>
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Truck className="size-3.5" /> Shipment progress
                      </p>
                      <FlowSteps steps={steps} />
                    </>
                  ) : returnInfo ? (
                    <>
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <RotateCcw className="size-3.5" /> Return progress
                      </p>
                      <FlowSteps steps={returnFlowSteps(returnInfo.status)} />
                      <p className="mt-3 text-xs text-muted-foreground">
                        Refund: <span className="font-semibold text-foreground">{formatPrice(returnInfo.refundAmount)}</span>
                      </p>
                    </>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <XCircle className="size-3.5 text-danger-600" /> This shipment was cancelled.
                    </p>
                  )}
                  {vendorOrder.trackingNumber && (
                    <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      Tracking: <span className="font-mono font-medium text-foreground">{vendorOrder.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}

      {/* Cancel whole order */}
      {cancellable && (
        <div className="flex justify-end">
          <Button variant="outline" className="text-rose-600 hover:bg-rose-50" onClick={() => setCancelOpen(true)}>
            <XCircle className="size-4" /> Cancel this order
          </Button>
        </div>
      )}

      {/* Cancel confirmation */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        description="The full order will be cancelled and all items restored to stock."
      >
        <p className="text-sm text-muted-foreground">
          You're about to cancel <span className="font-semibold text-foreground">{order.orderNumber}</span> (
          {formatPrice(order.totalAmount)}).
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={cancelling}>
            Keep order
          </Button>
          <Button variant="destructive" onClick={handleCancelOrder} loading={cancelling}>
            Yes, cancel order
          </Button>
        </div>
      </Modal>

      {/* Review modal */}
      <Modal
        open={Boolean(reviewItem)}
        onClose={() => setReviewItem(null)}
        title="Rate this product"
        description="Verified purchases only — your review helps other shoppers decide."
      >
        {reviewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{reviewItem.item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {reviewItem.item.variantName ? `${reviewItem.item.variantName} · ` : ''}
                  {formatPrice(reviewItem.item.price)} · from{' '}
                  {reviewItem.vendorOrder.storeId?.storeName || 'seller'}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="review-rating">Your rating</Label>
              <div className="mt-1.5 flex items-center gap-1" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={reviewRating === star}
                    aria-label={`${star} star${star === 1 ? '' : 's'}`}
                    onClick={() => setReviewRating(star)}
                    className="rounded-md p-0.5 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={cn(
                        'size-7',
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-semibold text-foreground">{reviewRating}.0</span>
              </div>
            </div>

            <div>
              <Label htmlFor="review-comment">Review (optional)</Label>
              <Textarea
                id="review-comment"
                rows={3}
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="What did you like or dislike?"
                className="mt-1.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setReviewItem(null)} disabled={submittingReview}>
                Close
              </Button>
              <Button onClick={submitReviewAction} loading={submittingReview}>
                <Star className="size-4" /> Submit review
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Return request modal */}
      <Modal
        open={Boolean(returnItem)}
        onClose={() => setReturnItem(null)}
        title="Request a return"
        description="Returns are reviewed by the seller. If approved, the refund goes back to your original payment method."
      >
        {returnItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{returnItem.item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {returnItem.item.variantName ? `${returnItem.item.variantName} · ` : ''}
                  {formatPrice(returnItem.item.price)} each · from{' '}
                  {returnItem.vendorOrder.storeId?.storeName || 'seller'}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="return-qty">Quantity to return</Label>
              <div className="mt-1.5 inline-flex items-center rounded-lg border border-border bg-card">
                <button
                  onClick={() => setReturnQty((q) => Math.max(1, q - 1))}
                  disabled={returnQty <= 1}
                  aria-label="Decrease return quantity"
                  className="flex size-9 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="min-w-10 text-center text-sm font-semibold">{returnQty}</span>
                <button
                  onClick={() => setReturnQty((q) => Math.min(returnItem.item.quantity, q + 1))}
                  disabled={returnQty >= returnItem.item.quantity}
                  aria-label="Increase return quantity"
                  className="flex size-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Refund estimate: {formatPrice(returnItem.item.price * returnQty)}
              </p>
            </div>

            <div>
              <Label htmlFor="return-reason">Reason *</Label>
              <div className="mt-1.5">
                <Select
                  id="return-reason"
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                  aria-label="Return reason"
                >
                  <option value="">Select a reason…</option>
                  {RETURN_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="return-note">Details (optional)</Label>
              <Textarea
                id="return-note"
                rows={3}
                value={returnNote}
                onChange={(event) => setReturnNote(event.target.value)}
                placeholder="Tell the seller what went wrong…"
                className="mt-1.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setReturnItem(null)} disabled={submittingReturn}>
                Close
              </Button>
              <Button onClick={submitReturn} loading={submittingReturn}>
                Submit return request
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
