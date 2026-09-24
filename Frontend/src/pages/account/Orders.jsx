import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronRight, PackageOpen, ReceiptText, Store, XCircle } from 'lucide-react'
import { formatPrice } from '../../lib/format.js'
import { isPlaceholderImage } from '../../lib/utils.js'
import { ORDER_META, canCancelOrder } from '../../lib/status.js'
import { useToast } from '../../components/ui/toast.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { cancelMyOrder, fetchMyOrders } from '../../services/account.js'
import { getErrorMessage } from '../../services/api.js'

function ItemThumbs({ orders }) {
  const items = orders.flatMap((vendor) => vendor.items)
  const shown = items.slice(0, 4)
  const extra = items.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((item, index) => (
        <span
          key={`${item.productId}-${index}`}
          className="-ml-2.5 flex size-11 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ring-2 ring-white first:ml-0"
        >
          {!isPlaceholderImage(item.image) ? (
            <img
              src={item.image}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
              className="size-full object-cover"
            />
          ) : (
            <PackageOpen className="size-4 text-slate-400" />
          )}
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-2.5 flex size-11 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 ring-2 ring-white">
          +{extra}
        </span>
      )}
    </div>
  )
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Orders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    try {
      setOrders(await fetchMyOrders())
    } catch (err) {
      setError(err)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelMyOrder(cancelTarget._id)
      toast({ title: 'Order cancelled', description: `${cancelTarget.orderNumber} cancelled and stock restored.`, variant: 'success' })
      setCancelTarget(null)
      load()
    } catch (error) {
      toast({ title: 'Could not cancel order', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setCancelling(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-semibold">Couldn't load your orders</p>
        <Button variant="outline" onClick={load}>Try again</Button>
      </div>
    )
  }

  if (!orders) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">My orders</h2>
        <p className="text-sm text-slate-500">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-slate-100">
            <ReceiptText className="size-8 text-slate-500" />
          </span>
          <h3 className="text-lg font-semibold">No orders yet</h3>
          <p className="max-w-sm text-sm text-slate-500">
            When you place an order, it will show up here with live status updates.
          </p>
          <Link to="/products">
            <Button size="lg">Start shopping</Button>
          </Link>
        </div>
      ) : (
        orders.map((order, orderIndex) => {
          const vendorOrders = order.vendorOrders || []
          const itemCount = vendorOrders.reduce((acc, vo) => acc + vo.items.reduce((n, item) => n + item.quantity, 0), 0)
          const storeNames = [...new Set(vendorOrders.map((vo) => vo.storeId?.storeName).filter(Boolean))]
          const cancellable = canCancelOrder(order)
          return (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: orderIndex * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    <div>
                      <p className="text-xs text-slate-500">Order number</p>
                      <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="size-3.5" /> {formatDate(order.createdAt)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {vendorOrders.length} {vendorOrders.length === 1 ? 'seller' : 'sellers'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={order.overallStatus} meta={ORDER_META} />
                </div>

                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                  <ItemThumbs orders={vendorOrders} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p className="text-sm">
                        <span className="font-bold">{itemCount}</span>{' '}
                        <span className="text-slate-500">{itemCount === 1 ? 'item' : 'items'}</span>
                      </p>
                      <p className="text-sm font-bold">{formatPrice(order.totalAmount)}</p>
                      {order.discountAmount > 0 && (
                        <span className="text-xs text-emerald-700">−{formatPrice(order.discountAmount)} coupon</span>
                      )}
                      <span className="text-xs capitalize text-slate-500">{order.paymentMethod.toLowerCase().replace('_', ' ')}</span>
                    </div>
                    {storeNames.length > 0 && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        {storeNames.map((name) => (
                          <span key={name} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5">
                            <Store className="size-3" /> {name}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {cancellable && (
                      <Button variant="outline" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => setCancelTarget(order)}>
                        <XCircle className="size-3.5" /> Cancel
                      </Button>
                    )}
                    <Link to={`/account/orders/${order._id}`}>
                      <Button size="sm">
                        View details <ChevronRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })
      )}

      {/* Cancel confirmation */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this order?"
        description="Cancelling restores the items to stock. Orders that have already shipped can't be cancelled."
      >
        {cancelTarget && (
          <p className="text-sm text-slate-500">
            You're about to cancel <span className="font-semibold text-slate-900">{cancelTarget.orderNumber}</span> (
            {formatPrice(cancelTarget.totalAmount)}).
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCancelTarget(null)} disabled={cancelling}>
            Keep order
          </Button>
          <Button variant="destructive" onClick={handleCancel} loading={cancelling}>
            Yes, cancel order
          </Button>
        </div>
      </Modal>
    </div>
  )
}
