import { useState } from 'react'
import { ArrowRight, Ban, ClipboardList, Truck } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { assignDelivery, fetchDeliveryPartners, fetchSellerOrders, updateSubOrderStatus } from '../../services/seller.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { formatPrice } from '../../lib/format.js'
import { SUBORDER_META } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'

const NEXT_STATUS = {
  placed: 'confirmed',
  confirmed: 'packed',
}

const NEXT_LABEL = {
  confirmed: 'Confirm order',
  packed: 'Mark as packed',
}

const CANCELABLE = ['placed', 'confirmed', 'packed']

export default function SellerOrders() {
  const { toast } = useToast()
  const { data: orders, loading, refetch } = useFetch(fetchSellerOrders)
  const [advanceTarget, setAdvanceTarget] = useState(null) // { orderId, subOrderId, status, orderNumber }
  const [busy, setBusy] = useState(false)

  // Hand-off state: { orderId, subOrderId, orderNumber, storeName }
  const [handoffTarget, setHandoffTarget] = useState(null)
  const [partners, setPartners] = useState(null)
  const [partnerId, setPartnerId] = useState('')

  const nextStep = (order, subOrder) => NEXT_STATUS[subOrder.status]

  const advance = async (status) => {
    setBusy(true)
    try {
      await updateSubOrderStatus(advanceTarget.orderId, advanceTarget.subOrderId, { status })
      toast({ title: 'Order updated', description: `${advanceTarget.orderNumber} marked as ${status}.`, variant: 'success' })
      setAdvanceTarget(null)
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

  const openHandoff = async (order, subOrder) => {
    setHandoffTarget({ orderId: order._id, subOrderId: subOrder._id, orderNumber: order.orderNumber, partner: subOrder.deliveryPartnerId })
    setPartnerId(subOrder.deliveryPartnerId?._id || '')
    setPartners(null)
    try {
      const list = await fetchDeliveryPartners()
      setPartners(list)
    } catch (error) {
      toast({ title: 'Could not load delivery partners', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const handoff = async () => {
    setBusy(true)
    try {
      const delivery = await assignDelivery({
        orderId: handoffTarget.orderId,
        subOrderId: handoffTarget.subOrderId,
        deliveryPartnerId: partnerId,
      })
      const partnerName = partners?.find((p) => p._id === partnerId)?.name
      toast({
        title: 'Handed to delivery partner',
        description: `${handoffTarget.orderNumber} is now with ${partnerName || 'the partner'} for pickup & delivery.`,
        variant: 'success',
      })
      setHandoffTarget(null)
      refetch()
    } catch (error) {
      toast({ title: 'Could not assign delivery partner', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title="Orders" subtitle="Confirm and pack orders — a delivery partner then picks up and delivers each shipment." />

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : orders?.length ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const subOrder = order.subOrder
            const next = nextStep(order, subOrder)
            const deliveryStatus = ['shipped', 'out_for_delivery', 'delivered'].includes(subOrder.status)
            return (
              <article key={order._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><ClipboardList className="size-4" /></span>
                    <div>
                      <p className="text-sm font-semibold">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">
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
                            {item.variantName && <span className="ml-1.5 text-xs text-slate-500">({item.variantName})</span>}
                            <span className="ml-1.5 text-xs text-slate-500">× {item.quantity}</span>
                          </span>
                          <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
                      <p className="font-medium text-slate-900">Deliver to</p>
                      <p className="mt-0.5">
                        {order.shippingAddress?.fullName}, {order.shippingAddress?.street}, {order.shippingAddress?.city} {order.shippingAddress?.pincode}, {order.shippingAddress?.state}
                      </p>
                      <p className="mt-1">
                        {order.paymentMethod?.toUpperCase()} · {order.paymentStatus || 'pending'} · {order.customer?.phone || ''}
                      </p>
                      {subOrder.deliveryPartnerId && (
                        <p className="mt-1">
                          <span className="font-medium text-slate-900">Delivery partner:</span> {subOrder.deliveryPartnerId.name || 'Assigned'}
                        </p>
                      )}
                      {subOrder.trackingNumber && (
                        <p className="mt-1"><span className="font-medium text-slate-900">Tracking:</span> {subOrder.trackingNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center gap-2 border-t border-slate-200 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                    {next && (
                      <Button onClick={() => setAdvanceTarget({ orderId: order._id, subOrderId: subOrder._id, status: next, orderNumber: order.orderNumber })} disabled={busy}>
                        <ArrowRight /> {NEXT_LABEL[next]}
                      </Button>
                    )}
                    {subOrder.status === 'packed' && !subOrder.deliveryPartnerId && (
                      <Button variant="outline" onClick={() => openHandoff(order, subOrder)} disabled={busy}>
                        <Truck /> Hand to delivery partner
                      </Button>
                    )}
                    {deliveryStatus && (
                      <p className="text-center text-xs text-slate-500">
                        {subOrder.status === 'delivered'
                          ? 'Delivered by the delivery partner.'
                          : 'In the delivery partner\u2019s hands — they update the shipment from their dashboard.'}
                      </p>
                    )}
                    {CANCELABLE.includes(subOrder.status) && (
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600" disabled={busy} onClick={() => cancel(order, subOrder)}>
                        <Ban /> Cancel order
                      </Button>
                    )}
                    {subOrder.status === 'return_requested' && (
                      <p className="text-center text-xs text-amber-700">Return requested — handle it in the Returns tab.</p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><ClipboardList className="size-6" /></span>
          <h2 className="text-base font-semibold">No orders yet</h2>
          <p className="max-w-sm text-sm text-slate-500">When customers buy from your store, their orders will show up here for fulfilment.</p>
        </div>
      )}

      {/* Confirm/advance modal */}
      <Modal
        open={!!advanceTarget}
        onClose={() => setAdvanceTarget(null)}
        title={advanceTarget ? `Mark as ${advanceTarget.status}` : ''}
        description={`${advanceTarget?.orderNumber} will move to "${advanceTarget?.status}".`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAdvanceTarget(null)}>Cancel</Button>
            <Button loading={busy} onClick={() => advance(advanceTarget.status)}>
              {advanceTarget?.status === 'packed' ? 'Pack order' : 'Confirm'}
            </Button>
          </>
        }
      >
        {advanceTarget?.status === 'packed' && (
          <p className="text-sm text-slate-500">
            Once packed, hand the shipment to a delivery partner — they handle pickup, transit and delivery to the customer.
          </p>
        )}
      </Modal>

      {/* Delivery hand-off modal */}
      <Modal
        open={!!handoffTarget}
        onClose={() => setHandoffTarget(null)}
        title="Hand to delivery partner"
        description={`${handoffTarget?.orderNumber} is packed and ready for pickup.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setHandoffTarget(null)}>Cancel</Button>
            <Button loading={busy} disabled={!partnerId} onClick={handoff}>
              <Truck /> Confirm hand-off
            </Button>
          </>
        }
      >
        {!partners ? (
          <p className="text-sm text-slate-500">Loading delivery partners…</p>
        ) : partners.length === 0 ? (
          <p className="text-sm text-slate-500">No active delivery partners found. An admin must add a user with the delivery role first.</p>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Delivery partner</label>
            <select
              value={partnerId}
              onChange={(event) => setPartnerId(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              autoFocus
            >
              <option value="">Choose a partner…</option>
              {partners.map((partner) => (
                <option key={partner._id} value={partner._id}>
                  {partner.name} ({partner.email})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              The partner picks up from your store and marks the shipment shipped → out for delivery → delivered.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
