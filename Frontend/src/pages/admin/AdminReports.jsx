import { BarChart3, Banknote, Package, ShoppingBag, Store, Users } from 'lucide-react'
import { PageIntro, StatCard } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchAdminSummary } from '../../services/admin.js'
import { formatPrice } from '../../lib/format.js'
import { ORDER_META, statusMetaOf } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'

const STATUS_COLORS = {
  placed: 'bg-slate-400',
  processing: 'bg-primary',
  shipped: 'bg-brand-500',
  delivered: 'bg-success',
  cancelled: 'bg-destructive',
}

export default function AdminReports() {
  const { data, loading } = useFetch(fetchAdminSummary)

  const breakdown = data?.orderStatusBreakdown || []
  const maxCount = breakdown.length ? Math.max(...breakdown.map((item) => item.count)) : 1
  const totalOrderCount = breakdown.reduce((sum, item) => sum + item.count, 0) || 1

  return (
    <div>
      <PageIntro title="Platform reports" subtitle="Revenue, orders, stores and product performance across ShopSphere." />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Banknote} label="Total revenue" value={formatPrice(data?.totalRevenue ?? 0)} hint="From delivered orders" tone="success" />
          <StatCard icon={ShoppingBag} label="Total orders" value={data?.totalOrders ?? 0} hint="All statuses" tone="primary" />
          <StatCard icon={Users} label="Customers" value={data?.totalCustomers ?? 0} hint="Registered accounts" tone="neutral" />
          <StatCard icon={Store} label="Sellers" value={data?.totalSellers ?? 0} hint={`${data?.pendingApplications ?? 0} pending`} tone="neutral" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Order status breakdown */}
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Order status breakdown</h2>
            <span className="text-xs text-muted-foreground">{totalOrderCount} orders</span>
          </div>
          <div className="space-y-4 px-5 py-5">
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : breakdown.length ? (
              breakdown.map((item) => {
                const meta = statusMetaOf(item._id, ORDER_META)
                return (
                  <div key={item._id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span className={`size-2.5 rounded-full ${STATUS_COLORS[item._id] || 'bg-muted-foreground'}`} />
                        {meta.label}
                      </span>
                      <span className="text-muted-foreground">{item.count} · {Math.round((item.count / totalOrderCount) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${STATUS_COLORS[item._id] || 'bg-muted-foreground'}`}
                        style={{ width: `${Math.max(4, (item.count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
            )}
          </div>
        </section>

        {/* Product health */}
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Package className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Catalog health</h2>
          </div>
          <div className="space-y-4 px-5 py-5">
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : (
              <>
                {[
                  { label: 'Total products', value: data?.totalProducts ?? 0, pct: 100, tone: 'bg-primary' },
                  { label: 'Active listings', value: data?.activeProducts ?? 0, pct: data?.totalProducts ? (data.activeProducts / data.totalProducts) * 100 : 0, tone: 'bg-success' },
                  { label: 'Inactive / pending', value: (data?.totalProducts ?? 0) - (data?.activeProducts ?? 0), pct: data?.totalProducts ? ((data.totalProducts - data.activeProducts) / data.totalProducts) * 100 : 0, tone: 'bg-warning-500' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold">{row.value}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${Math.max(4, row.pct)}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Active share: {data?.totalProducts ? Math.round((data.activeProducts / data.totalProducts) * 100) : 0}% of the catalog is live.</p>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top stores */}
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Store className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Top stores by revenue</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[...Array(5)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : data?.topStores?.length ? (
            <ul className="divide-y divide-border">
              {data.topStores.map((store, index) => (
                <li key={store.storeId} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{store.storeName}</p>
                    <p className="text-xs text-muted-foreground">{store.ordersCount} delivered orders</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{formatPrice(store.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No delivered sales yet.</p>
          )}
        </section>

        {/* Best sellers */}
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <BarChart3 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Best-selling products</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[...Array(5)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : data?.bestSellers?.length ? (
            <ul className="divide-y divide-border">
              {data.bestSellers.map((item, index) => (
                <li key={item._id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.quantitySold} sold</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{formatPrice(item.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
          )}
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-6 rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Recent platform orders</h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">{[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
        ) : data?.recentOrders?.length ? (
          <ul className="divide-y divide-border">
            {data.recentOrders.map((order) => (
              <li key={order._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customerId?.name} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {order.paymentStatus || 'pending'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold">{formatPrice(order.totalAmount)}</span>
                  <StatusBadge status={order.overallStatus} meta={ORDER_META} />
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