import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  BarChart3,
  CircleDollarSign,
  Package,
  ShoppingBag,
  Store,
  Tags,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { PageIntro, StatCard } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchAdminSummary } from '../../services/admin.js'
import { formatPrice } from '../../lib/format.js'
import { ORDER_META, statusMetaOf } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { Button } from '../../components/ui/Button.jsx'

const STATUS_COLORS = {
  placed: 'bg-slate-400',
  processing: 'bg-primary',
  shipped: 'bg-brand-500',
  delivered: 'bg-success',
  cancelled: 'bg-destructive',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data, loading } = useFetch(fetchAdminSummary)

  const breakdown = data?.orderStatusBreakdown || []
  const maxCount = breakdown.length ? Math.max(...breakdown.map((item) => item.count)) : 1

  return (
    <div>
      <PageIntro
        title="Platform dashboard"
        subtitle="An overview of ShopSphere — users, sellers, products and orders."
        actions={
          <Button variant="outline" onClick={() => navigate('/admin/reports')}>
            <BarChart3 /> View reports
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Users} label="Customers" value={data?.totalCustomers ?? 0} hint="Registered accounts" tone="primary" />
          <StatCard icon={Store} label="Sellers" value={data?.totalSellers ?? 0} hint={`${data?.pendingApplications ?? 0} pending applications`} tone={data?.pendingApplications > 0 ? 'warning' : 'neutral'} />
          <StatCard icon={Package} label="Products" value={`${data?.activeProducts ?? 0}/${data?.totalProducts ?? 0}`} hint="Active / total" tone="neutral" />
          <StatCard icon={ShoppingBag} label="Orders" value={data?.totalOrders ?? 0} hint="All time" tone="primary" />
          <StatCard icon={CircleDollarSign} label="Revenue" value={formatPrice(data?.totalRevenue ?? 0)} hint="Delivered orders" tone="success" />
        </div>
      )}

      {/* Pending work alerts */}
      {!loading && data?.pendingApplications > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <TriangleAlert className="size-4 shrink-0 text-warning-700" />
            <span className="font-semibold text-warning-800">{data.pendingApplications} seller application{data.pendingApplications > 1 ? 's' : ''} awaiting review</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/sellers')}>
            Review applications <ArrowRight />
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Order status breakdown */}
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Orders by status</h2>
            <button onClick={() => navigate('/admin/reports')} className="text-xs font-medium text-primary hover:underline">Full report</button>
          </div>
          <div className="space-y-4 px-5 py-5">
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />)}</div>
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
                      <span className="text-muted-foreground">{item.count}</span>
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

        {/* Top stores */}
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Store className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Top stores</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : data?.topStores?.length ? (
            <ul className="divide-y divide-border">
              {data.topStores.map((store, index) => (
                <li key={store.storeId} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{store.storeName}</p>
                    <p className="text-xs text-muted-foreground">{store.ordersCount} orders</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{formatPrice(store.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No store sales yet.</p>
          )}
        </section>
      </div>

      {/* Best sellers + recent orders */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Package className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Best-selling products</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : data?.bestSellers?.length ? (
            <ul className="divide-y divide-border">
              {data.bestSellers.slice(0, 5).map((item, index) => (
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

        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <button onClick={() => navigate('/admin/reports')} className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : data?.recentOrders?.length ? (
            <ul className="divide-y divide-border">
              {data.recentOrders.map((order) => (
                <li key={order._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{order.orderNumber}</p>
                    <p className="truncate text-xs text-muted-foreground">{order.customerId?.name || 'Customer'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold">{formatPrice(order.totalAmount)}</span>
                    <StatusBadge status={order.overallStatus} meta={ORDER_META} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Manage categories', icon: Tags, to: '/admin/categories' },
          { label: 'Moderate products', icon: Package, to: '/admin/products' },
          { label: 'Manage coupons', icon: Banknote, to: '/admin/coupons' },
          { label: 'Handle disputes', icon: TriangleAlert, to: '/admin/disputes' },
        ].map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-medium shadow-card transition-colors hover:border-primary/40"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}