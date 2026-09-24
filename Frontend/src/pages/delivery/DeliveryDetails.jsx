import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, MapPin, Package, Phone, StickyNote, Truck } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { ShipmentTimeline } from '../../components/delivery/ShipmentTimeline.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchDeliveryById, updateDeliveryStatus } from '../../services/delivery.js'
import { DELIVERY_META, nextDeliveryStatus } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { isPlaceholderImage } from '../../lib/utils.js'

const NEXT_LABEL = {
  shipped: 'Confirm pickup & mark shipped',
  out_for_delivery: 'Mark out for delivery',
  delivered: 'Mark delivered',
}

function AddressCard({ tone, title, lines, phone }) {
  const toneClasses = tone === 'pickup' ? 'text-emerald-600' : 'text-emerald-600'
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${toneClasses}`}>
        <MapPin className="size-3.5" /> {title}
      </p>
      <div className="mt-2 space-y-0.5 text-sm">
        {lines.map((line) => (
          <p key={line} className={line ? 'text-slate-900' : 'text-slate-500'}>
            {line || '—'}
          </p>
        ))}
      </div>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:underline"
        >
          <Phone className="size-3.5" /> {phone}
        </a>
      )}
    </div>
  )
}

export default function DeliveryDetails() {
  const { deliveryId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: delivery, loading, refetch } = useFetch(() => fetchDeliveryById(deliveryId), [deliveryId])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Truck className="size-6" />
        </span>
        <h2 className="text-base font-semibold">Delivery not found</h2>
        <p className="max-w-sm text-sm text-slate-500">It may have been removed, or you don't have access to it.</p>
        <Button variant="outline" onClick={() => navigate('/delivery/deliveries')}>
          <ArrowLeft /> Back to my deliveries
        </Button>
      </div>
    )
  }

  const next = nextDeliveryStatus(delivery.status)
  const pickup = delivery.pickupAddress || {}
  const drop = delivery.deliveryAddress || {}

  const advance = async () => {
    setBusy(true)
    try {
      await updateDeliveryStatus(delivery._id, next)
      toast({ title: 'Shipment updated', description: `Status moved to "${next.replace(/_/g, ' ')}".`, variant: 'success' })
      setConfirmOpen(false)
      refetch()
    } catch (error) {
      toast({ title: 'Could not update shipment', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to="/delivery/deliveries" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900">
        <ArrowLeft className="size-4" /> My deliveries
      </Link>

      <PageIntro
        title={`Shipment #${delivery.orderId?.orderNumber || '—'}`}
        subtitle={`Assigned ${new Date(delivery.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${delivery.deliveredAt ? ` · Delivered ${new Date(delivery.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={delivery.status} meta={DELIVERY_META} />
            {next && (
              <Button onClick={() => setConfirmOpen(true)}>
                {next === 'delivered' ? <Check /> : <Truck />} {NEXT_LABEL[next]}
              </Button>
            )}
          </div>
        }
      />

      {/* Timeline card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold">Shipment progress</h2>
        <ShipmentTimeline status={delivery.status} />
        {next && (
          <p className="mt-5 text-center text-xs text-slate-500">
            Next step: <span className="font-medium text-slate-900">{NEXT_LABEL[next]}</span> — use the button above.
          </p>
        )}
        {delivery.status === 'delivered' && (
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-emerald-700">
            <Check className="size-3.5" /> This shipment was delivered successfully.
          </p>
        )}
      </section>

      {/* Addresses */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <AddressCard
          tone="pickup"
          title="Pickup from store"
          phone={pickup.phone}
          lines={[pickup.storeName, pickup.street, `${pickup.city || ''} ${pickup.state || ''} ${pickup.pincode || ''}`.trim()]}
        />
        <AddressCard
          tone="drop"
          title="Deliver to customer"
          phone={drop.phone}
          lines={[drop.customerName, drop.street, `${drop.city || ''} ${drop.state || ''} ${drop.pincode || ''}`.trim()]}
        />
      </div>

      {/* Items + meta */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <Package className="size-4 text-emerald-600" />
            <h2 className="text-sm font-semibold">Items to carry ({delivery.items?.length || 0})</h2>
          </div>
          <ul className="divide-y divide-slate-200">
            {(delivery.items || []).map((item, index) => (
              <li key={index} className="flex items-center gap-3 px-5 py-3">
                {!isPlaceholderImage(item.image) ? (
                  <img
                    src={item.image}
                    alt=""
                    className="size-12 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover"
                    onError={(event) => {
                      event.currentTarget.style.visibility = 'hidden'
                    }}
                  />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500">
                    <Package className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">Quantity: {item.quantity}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  × {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold">Shipment info</h2>
            </div>
            <dl className="space-y-3 px-5 py-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Order</dt>
                <dd className="font-medium">#{delivery.orderId?.orderNumber || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Payment</dt>
                <dd className="font-medium capitalize">{delivery.orderId?.paymentMethod || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <StatusBadge status={delivery.status} meta={DELIVERY_META} />
                </dd>
              </div>
            </dl>
          </section>

          {delivery.note && (
            <section className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <StickyNote className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <p className="text-amber-800">
                <span className="font-semibold">Note:</span> {delivery.note}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Confirm advance */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={next ? NEXT_LABEL[next] : ''}
        description={next === 'delivered'
          ? 'Confirm the customer received this shipment. This cannot be undone.'
          : next
            ? `This shipment will move to "${next.replace(/_/g, ' ')}".`
            : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={advance} variant={next === 'delivered' ? 'success' : 'default'}>
              {next === 'delivered' ? 'Confirm delivery' : 'Confirm'}
            </Button>
          </>
        }
      >
        {next === 'shipped' && (
          <p className="text-sm text-slate-500">
            Make sure you've collected all {delivery.items?.length || 0} item{(delivery.items?.length || 0) !== 1 ? 's' : ''} from{' '}
            <span className="font-medium text-slate-900">{pickup.storeName}</span> — the seller has packed this order and is waiting for you.
          </p>
        )}
        {next === 'out_for_delivery' && (
          <p className="text-sm text-slate-500">
            Confirm you're heading out to <span className="font-medium text-slate-900">{drop.customerName}</span> in {drop.city}.
          </p>
        )}
      </Modal>
    </div>
  )
}
