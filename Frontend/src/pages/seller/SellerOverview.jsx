import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Package,
  PackagePlus,
  RotateCcw,
  ShoppingBag,
  TriangleAlert,
} from 'lucide-react'
import { PageIntro, StatCard } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchSellerSummary } from '../../services/seller.js'
import { formatPrice } from '../../lib/format.js'
import { statusMetaOf, SUBORDER_META } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useOutletContext } from 'react-router-dom'

export default function SellerOverview() {
  const navigate = useNavigate()
  const { store } = useOutletContext()
  const { data, loading } = useFetch(fetchSellerSummary)

  const quickActions = [
    { label: 'Add product', icon: PackagePlus, to: '/seller/products/new' },
    { label: 'View inventory', icon: Boxes, to: '/seller/inventory' },
    { label: 'Seller orders', icon: ClipboardList, to: '/seller/orders' },
    { label: 'View analytics', icon: BarChart3, to: '/seller/analytics' },
  ]

  return (
    <div>
      <PageIntro
        title={`Welcome back, ${store?.storeName || 'Seller'}`}
        subtitle="Here's what's happening in your store today."
        actions={
          <Button onClick={() => navigate('/seller/products/new')}>
            <PackagePlus /> Add product
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={CircleDollarSign} label="Total sales" value={formatPrice(data?.totalSales)} hint="From delivered orders" tone="success" />
          <StatCard icon={ShoppingBag} label="Total orders" value={data?.totalOrders ?? 0} hint={`${data?.pendingOrders ?? 0} pending fulfilment`} tone="primary" />
          <StatCard icon={Package} label="Products" value={`${data?.activeProducts ?? 0}/${data?.totalProducts ?? 0}`} hint="Active / total" tone="neutral" />
          <StatCard icon={TriangleAlert} label="Low stock" value={data?.lowStockProducts ?? 0} hint={`${data?.outOfStockProducts ?? 0} out of stock`} tone={data?.lowStockProducts > 0 ? 'warning' : 'neutral'} />
        </div>
      )}

      {/* Low stock alert */}
      {!loading && (data?.lowStockProducts ?? 0) > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <TriangleAlert className="size-4 shrink-0 text-amber-700" />
            <span className="font-semibold text-amber-800">
              {data.lowStockProducts} product{data.lowStockProducts > 1 ? 's are' : ' is'} running low on stock
            </span>
            <span className="text-amber-700/80">({data.outOfStockProducts} out of stock)</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/seller/inventory')}>
            Review inventory <ArrowRight />
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Recent orders */}
        <section className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-18px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <button onClick={() => navigate('/seller/orders')} className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : data?.recentOrders?.length ? (
            <ul className="divide-y divide-slate-100">
              {data.recentOrders.map((order) => (
                <li key={order._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {order.subOrder.itemsCount} item{order.subOrder.itemsCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold">{formatPrice(order.subOrder.subtotal)}</span>
                    <StatusBadge status={order.subOrder.status} meta={SUBORDER_META} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No orders yet — they'll appear here once customers buy.</p>
          )}
        </section>

        {/* Best sellers + quick actions */}
        <div className="space-y-6">
          <section className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-18px_rgba(15,23,42,0.22)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold">Best sellers</h2>
            </div>
            {loading ? (
              <div className="space-y-3 p-5">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
            ) : data?.bestSellers?.length ? (
              <ul className="divide-y divide-slate-100">
                {data.bestSellers.slice(0, 3).map((item, index) => (
                  <li key={item._id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-[11px] font-bold text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.quantitySold} sold</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{formatPrice(item.revenue)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No sales yet.</p>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.label}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(action.to)}
                  className="flex flex-col items-start gap-2 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:ring-indigo-200 hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.3)]"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.9)]">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Fulfilment tip strip */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm text-slate-500 ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <RotateCcw className="mt-0.5 size-4 shrink-0 text-indigo-600" />
        <p>
          Keep an eye on <button onClick={() => navigate('/seller/returns')} className="font-medium text-indigo-600 hover:underline">return requests</button> — approving a return and marking it refunded restocks the item automatically.
        </p>
      </div>
    </div>
  )
}