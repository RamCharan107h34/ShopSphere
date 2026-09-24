import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, MapPin, PackageCheck, Search, Truck } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { ShipmentTimeline } from '../../components/delivery/ShipmentTimeline.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchMyDeliveries } from '../../services/delivery.js'
import { DELIVERY_META, statusMetaOf } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { Input } from '../../components/ui/Input.jsx'

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export default function DeliveryList() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [query, setQuery] = useState('')

  const { data: deliveries, loading } = useFetch(
    () => fetchMyDeliveries(statusFilter || undefined),
    [statusFilter],
  )

  const all = deliveries || []
  const filtered = query.trim()
    ? all.filter((d) => {
        const q = query.trim().toLowerCase()
        return (
          d.orderId?.orderNumber?.toLowerCase().includes(q) ||
          d.deliveryAddress?.customerName?.toLowerCase().includes(q) ||
          d.deliveryAddress?.city?.toLowerCase().includes(q) ||
          d.deliveryAddress?.pincode?.includes(q)
        )
      })
    : all

  return (
    <div>
      <PageIntro title="My deliveries" subtitle="Every shipment assigned to you — filter by status or search." />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const count = filter.key
            ? all.filter((d) => d.status === filter.key).length
            : all.length
          return (
            <button
              key={filter.key || 'all'}
              onClick={() => setStatusFilter(filter.key)}
              className={
                statusFilter === filter.key
                  ? 'rounded-full bg-emerald-600 px-3.5 py-1.5 text-sm font-medium text-white'
                  : 'rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-emerald-50 hover:text-slate-900'
              }
            >
              {filter.label} <span className="opacity-60">({count})</span>
            </button>
          )
        })}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order, customer, pincode…"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="space-y-4">
          {filtered.map((delivery) => (
            <article
              key={delivery._id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-emerald-200"
            >
              <button onClick={() => navigate(`/delivery/deliveries/${delivery._id}`)} className="block w-full text-left">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Truck className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">#{delivery.orderId?.orderNumber || 'Order'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(delivery.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
                        {delivery.storeId?.storeName || 'Store'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={delivery.status} meta={DELIVERY_META} />
                </div>

                <div className="px-5 py-4">
                  {/* Route summary */}
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm">
                    <p className="flex min-w-0 items-start gap-1.5">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span className="min-w-0">
                        <span className="block text-xs text-slate-500">Pickup</span>
                        <span className="block truncate font-medium">
                          {delivery.pickupAddress?.storeName}, {delivery.pickupAddress?.city} {delivery.pickupAddress?.pincode}
                        </span>
                      </span>
                    </p>
                    <p className="flex min-w-0 items-start gap-1.5">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span className="min-w-0">
                        <span className="block text-xs text-slate-500">Deliver to</span>
                        <span className="block truncate font-medium">
                          {delivery.deliveryAddress?.customerName}, {delivery.deliveryAddress?.city} {delivery.deliveryAddress?.pincode}
                        </span>
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <PackageCheck className="size-4 shrink-0" />
                      {delivery.items?.length || 0} item{(delivery.items?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <ShipmentTimeline status={delivery.status} />
                  </div>

                  <p className="mt-3 text-right text-xs font-medium text-emerald-600">
                    View details & update status →
                  </p>
                </div>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ClipboardList className="size-6" />
          </span>
          <h2 className="text-base font-semibold">
            {query ? 'No matching deliveries' : statusFilter
              ? `No ${statusMetaOf(statusFilter, DELIVERY_META).label.toLowerCase()} shipments`
              : 'No deliveries yet'}
          </h2>
          <p className="max-w-sm text-sm text-slate-500">
            {query
              ? 'Try a different order number, customer name or pincode.'
              : 'When sellers hand packed orders to you, they will show up here.'}
          </p>
        </div>
      )}
    </div>
  )
}
