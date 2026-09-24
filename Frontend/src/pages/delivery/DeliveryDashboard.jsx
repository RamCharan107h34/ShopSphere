import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bike, Check, Clock, MapPin, PackageCheck, Truck } from 'lucide-react'
import { PageIntro, StatCard } from '../../components/seller/PageIntro.jsx'
import { ShipmentTimeline } from '../../components/delivery/ShipmentTimeline.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchMyDeliveries } from '../../services/delivery.js'
import { DELIVERY_META, statusMetaOf } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'

// Deliveries the partner should act on first
const ACTIVE_STATUSES = ['assigned', 'shipped', 'out_for_delivery']

export default function DeliveryDashboard() {
  const navigate = useNavigate()
  const { data: deliveries, loading } = useFetch(fetchMyDeliveries)

  const all = deliveries || []
  const countOf = (status) => all.filter((d) => d.status === status).length
  const active = all
    .filter((d) => ACTIVE_STATUSES.includes(d.status))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const nextUp = active[0]

  return (
    <div>
      <PageIntro
        title={`Hello, ${(all[0]?.deliveryPartnerId?.name) || 'Delivery partner'}`}
        subtitle="Your shipments at a glance — pick up, move, and deliver."
        actions={
          <button
            onClick={() => navigate('/delivery/deliveries')}className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-px hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
            All deliveries <ArrowRight className="ml-1 inline size-3.5" />
          </button>
        }
      />

      {/* Status counts */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Clock} label="Assigned" value={countOf('assigned')} hint="Waiting for pickup" tone="neutral" />
          <StatCard icon={PackageCheck} label="Shipped" value={countOf('shipped')} hint="Collected from seller" tone="primary" />
          <StatCard icon={Truck} label="Out for delivery" value={countOf('out_for_delivery')} hint="On the way" tone="warning" />
          <StatCard icon={Check} label="Delivered" value={countOf('delivered')} hint="Completed shipments" tone="success" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Active shipments */}
        <section className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-18px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold">Active shipments</h2>
            <button onClick={() => navigate('/delivery/deliveries')} className="text-xs font-medium text-emerald-600 hover:underline">
              View all
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : active.length ? (
            <ul className="divide-y divide-slate-100">
              {active.slice(0, 5).map((delivery) => (
                <li key={delivery._id}>
                  <button
                    onClick={() => navigate(`/delivery/deliveries/${delivery._id}`)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-emerald-50/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        #{delivery.orderId?.orderNumber || 'Order'} · {delivery.storeId?.storeName || 'Store'}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {delivery.deliveryAddress?.city || '—'} → {delivery.items?.length || 0} item
                        {(delivery.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={delivery.status} meta={DELIVERY_META} />
                      <ArrowRight className="size-4 text-slate-500" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              No active shipments — you're all caught up. 🎉
            </p>
          )}
        </section>

        {/* Next shipment */}
        <section className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-18px_rgba(15,23,42,0.22)]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Bike className="size-4 text-emerald-600" />
            <h2 className="text-sm font-semibold">Next up</h2>
          </div>
          {loading ? (
            <div className="p-5">
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : nextUp ? (
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">#{nextUp.orderId?.orderNumber || 'Order'}</p>
                <StatusBadge status={nextUp.status} meta={DELIVERY_META} />
              </div>
              <ShipmentTimeline status={nextUp.status} />
              <div className="space-y-1.5 text-xs text-slate-500">
                <p className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <span>
                    <span className="font-medium text-slate-900">Pickup:</span> {nextUp.pickupAddress?.storeName}, {nextUp.pickupAddress?.city}
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <span>
                    <span className="font-medium text-slate-900">Drop:</span> {nextUp.deliveryAddress?.customerName}, {nextUp.deliveryAddress?.city} {nextUp.deliveryAddress?.pincode}
                  </span>
                </p>
              </div>
              <button
                onClick={() => navigate(`/delivery/deliveries/${nextUp._id}`)}
                className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(5,150,105,0.9)] transition-all hover:-translate-y-px hover:shadow-[0_16px_34px_-14px_rgba(5,150,105,1)] active:translate-y-0"
              >
                Open shipment details
              </button>
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Nothing assigned yet. New shipments from sellers will appear here.
            </p>
          )}
        </section>
      </div>

      {/* Delivered today-ish strip */}
      {!loading && countOf('delivered') > 0 && (
        <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-sm text-slate-500 ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <Check className="size-4 shrink-0 text-emerald-600" />
          <p>
            You've completed <span className="font-semibold text-slate-900">{countOf('delivered')}</span>{' '}
            shipment{countOf('delivered') !== 1 ? 's' : ''} — status{' '}
            <span className="font-medium text-slate-900">{statusMetaOf('delivered', DELIVERY_META).label.toLowerCase()}</span>{' '}
            shipments stay in your history.
          </p>
        </div>
      )}
    </div>
  )
}
