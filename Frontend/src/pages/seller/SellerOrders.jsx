import { useState } from 'react'
import { ArrowRight, Ban, ClipboardList, Truck } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchSellerOrders, updateSubOrderStatus } from '../../services/seller.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { formatPrice } from '../../lib/format.js'
import { SUBORDER_META } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Input } from '../../components/ui/Input.jsx'

const NEXT_STATUS = {
  placed: 'confirmed',
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
}

const NEXT_LABEL = {
  confirmed: 'Confirm order',
  packed: 'Mark as packed',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
}

const CANCELABLE = ['placed', 'confirmed', 'packed']

export default function SellerOrders() {
  const { toast } = useToast()
  const { data: orders, loading, refetch } = useFetch(fetchSellerOrders)
  const [advanceTarget, setAdvanceTarget] = useState(null) // { orderId, subOrderId, status, orderNumber }
  const [tracking, setTracking] = useState('')
  const [busy, setBusy] = useState(false)

  const nextStep = (order, subOrder) => NEXT_STATUS[subOrder.status]

  const advance = async (status) => {
    setBusy(true)
    try {
      await updateSubOrderStatus(advanceTarget.orderId, advanceTarget.subOrderId, {
        status,
        ...(status === 'shipped' && tracking.trim() ? { trackingNumber: tracking.trim() } : {}),
      })
      toast({ title: 'Order updated', description: `${advanceTarget.orderNumber} marked as ${status}.`, variant: 'success' })
      setAdvanceTarget(null)
      setTracking('')
      refetch()
    } catch (error) {
      toast({ title: 'Could not update order', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (order, subOrder) => {
    setBusy(true)
    try {
      await updateSubOrderStatus(order._id, subOrder._id, { status: 'cancelled' })
      toast({ title: 'Order cancelled', description: `${order.orderNumber} cancelled and stock restored.`, variant: 'success' })
      refetch()
    } catch (error) {
      toast({ title: 'Could not cancel order', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const openAdvance = (order, subOrder) => {
    setTracking('')
    setAdvanceTarget({ orderId: order._id, subOrderId: subOrder._id, status: nextStep(order, subOrder), orderNumber: order.orderNumber })
  }

  return (
    <div>
      <PageIntro title="Orders" subtitle="Fulfil orders for your store — advance each one through the shipment flow." />

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : orders?.length ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const subOrder = order.subOrder
            const next = nextStep(order, subOrder)
            return (
              <article key={order._id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><ClipboardList className="size-4" /></span>
                    <div>
                      <p className="text-sm font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.customer?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={subOrder.status} meta={SUBORDER_META} />
                    <span className="text-sm font-bold">{formatPrice(subOrder.subtotal)}</span>
                  </div>
                </div>

                <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px]">
                  {/* Items + address */}
                  <div className="min-w-0">
                    <ul className="space-y-2">
                      {subOrder.items.map((item, index) => (
                        <li key={index} className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{item.title}</span>
                            {item.variantName && <span className="ml-1.5 text-xs text-muted-foreground">({item.variantName})</span>}
                            <span className="ml-1.5 text-xs text-muted-foreground">× {item.quantity}</span>
                          </span>
                          <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Deliver to</p>
                      <p className="mt-0.5">
                        {order.shippingAddress?.fullName}, {order.shippingAddress?.street}, {order.shippingAddress?.city} {order.shippingAddress?.pincode}, {order.shippingAddress?.state}
                      </p>
                      <p className="mt-1">
                        {order.paymentMethod?.toUpperCase()} · {order.paymentStatus || 'pending'} · {order.customer?.phone || ''}
                      </p>
                      {subOrder.trackingNumber && (
                        <p className="mt-1"><span className="font-medium text-foreground">Tracking:</span> {subOrder.trackingNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center gap-2 border-t border-border pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                    {next && (
                      <Button onClick={() => openAdvance(order, subOrder)} disabled={busy}>
                        {next === 'shipped' ? <Truck /> : <ArrowRight />} {NEXT_LABEL[next]}
                      </Button>
                    )}
                    {CANCELABLE.includes(subOrder.status) && (
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" disabled={busy} onClick={() => cancel(order, subOrder)}>
                        <Ban /> Cancel order
                      </Button>
                    )}
                    {subOrder.status === 'return_requested' && (
                      <p className="text-center text-xs text-warning-700">Return requested — handle it in the Returns tab.</p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ClipboardList className="size-6" /></span>
          <h2 className="text-base font-semibold">No orders yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">When customers buy from your store, their orders will show up here for fulfilment.</p>
        </div>
      )}

      <Modal
        open={!!advanceTarget}
        onClose={() => setAdvanceTarget(null)}
        title={advanceTarget ? `Mark as ${advanceTarget.status}` : ''}
        description={`${advanceTarget?.orderNumber} will move to "${advanceTarget?.status}".`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAdvanceTarget(null)}>Cancel</Button>
            <Button loading={busy} onClick={() => advance(advanceTarget.status)}>
              {advanceTarget?.status === 'shipped' ? 'Ship order' : `Mark ${advanceTarget?.status || ''}`}
            </Button>
          </>
        }
      >
        {advanceTarget?.status === 'shipped' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tracking number (optional)</label>
            <Input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="e.g. SS1234567890IN" autoFocus />
            <p className="mt-1.5 text-xs text-muted-foreground">Customers will see this on their order page.</p>
          </div>
        )}
        {advanceTarget?.status === 'delivered' && (
          <p className="text-sm text-muted-foreground">Confirm the shipment reached the customer. This cannot be undone.</p>
        )}
      </Modal>
    </div>
  )
}