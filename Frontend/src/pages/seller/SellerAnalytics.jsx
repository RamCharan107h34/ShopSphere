import { useNavigate } from 'react-router-dom'
import { BarChart3, Boxes, CircleDollarSign, Package, ShoppingBag, TriangleAlert } from 'lucide-react'
import { PageIntro, StatCard } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchSellerSummary } from '../../services/seller.js'
import { formatPrice } from '../../lib/format.js'
import { SUBORDER_META } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'

function Bar({ value, max }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all" style={{ width: `${width}%` }} />
    </div>
  )
}

export default function SellerAnalytics() {
  const navigate = useNavigate()
  const { data, loading } = useFetch(fetchSellerSummary)

  if (loading) {
    return (
      <div>
        <PageIntro title="Analytics" subtitle="Your store's performance at a glance." />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  const bestSellers = data?.bestSellers || []
  const maxSold = bestSellers.length ? Math.max(...bestSellers.map((item) => item.quantitySold)) : 1

  return (
    <div>
      <PageIntro title="Analytics" subtitle="Sales, order and product performance for your store." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CircleDollarSign} label="Total sales" value={formatPrice(data?.totalSales)} hint="Delivered orders only" tone="success" />
        <StatCard icon={ShoppingBag} label="Orders" value={data?.totalOrders ?? 0} hint={`${data?.pendingOrders ?? 0} in progress`} tone="primary" />
        <StatCard icon={Package} label="Products" value={`${data?.activeProducts ?? 0}/${data?.totalProducts ?? 0}`} hint="Active / total" tone="neutral" />
        <StatCard icon={TriangleAlert} label="Low stock" value={data?.lowStockProducts ?? 0} hint={`${data?.outOfStockProducts ?? 0} out of stock`} tone={data?.lowStockProducts > 0 ? 'warning' : 'neutral'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Best sellers */}
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <BarChart3 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Best-selling products</h2>
          </div>
          {bestSellers.length ? (
            <ul className="space-y-5 px-5 py-5">
              {bestSellers.map((item) => (
                <li key={item._id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{item.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.quantitySold} sold · {formatPrice(item.revenue)}</span>
                  </div>
                  <Bar value={item.quantitySold} max={maxSold} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No sales yet — best sellers appear once orders roll in.</p>
          )}
        </section>

        {/* Product health */}
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Boxes className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Product health</h2>
          </div>
          <div className="space-y-3 px-5 py-5">
            {[
              { label: 'Active listings', value: data?.activeProducts ?? 0, bar: data?.totalProducts ? (data.activeProducts / data.totalProducts) * 100 : 0, tone: 'bg-success' },
              { label: 'Low on stock', value: data?.lowStockProducts ?? 0, bar: data?.totalProducts ? (data.lowStockProducts / data.totalProducts) * 100 : 0, tone: 'bg-warning-500' },
              { label: 'Out of stock', value: data?.outOfStockProducts ?? 0, bar: data?.totalProducts ? (data.outOfStockProducts / data.totalProducts) * 100 : 0, tone: 'bg-destructive' },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold">{row.value}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${row.bar}%` }} />
                </div>
              </div>
            ))}
            <button onClick={() => navigate('/seller/inventory')} className="mt-2 w-full text-center text-xs font-medium text-primary hover:underline">
              Manage inventory →
            </button>
          </div>
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-6 rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Recent orders</h2>
          <button onClick={() => navigate('/seller/orders')} className="text-xs font-medium text-primary hover:underline">View all</button>
        </div>
        {data?.recentOrders?.length ? (
          <ul className="divide-y divide-border">
            {data.recentOrders.map((order) => (
              <li key={order._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
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
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No orders yet.</p>
        )}
      </section>
    </div>
  )
}