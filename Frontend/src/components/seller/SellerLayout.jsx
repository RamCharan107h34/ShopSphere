import { useCallback, useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  PackagePlus,
  RotateCcw,
  Store,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Badge } from '../ui/Badge.jsx'
import { fetchMyStore } from '../../services/seller.js'

const NAV_ITEMS = [
  { to: '/seller', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/seller/store', label: 'Store profile', icon: Store, end: false },
  { to: '/seller/products', label: 'Products', icon: Package, end: false },
  { to: '/seller/products/new', label: 'Add product', icon: PackagePlus, end: false },
  { to: '/seller/inventory', label: 'Inventory', icon: Boxes, end: false },
  { to: '/seller/orders', label: 'Orders', icon: ClipboardList, end: false },
  { to: '/seller/returns', label: 'Returns', icon: RotateCcw, end: false },
  { to: '/seller/analytics', label: 'Analytics', icon: BarChart3, end: false },
]

const STORE_STATUS_META = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending review', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'danger' },
}

function Avatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary">
      {initials}
    </span>
  )
}

function NavItems({ onNavigate, className }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                className,
              )
            }
          >
            <Icon className="size-4 shrink-0" /> <span className="truncate">{item.label}</span>
          </NavLink>
        )
      })}
    </>
  )
}

export default function SellerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [storeData, setStoreData] = useState(null)
  const [storeLoading, setStoreLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setStoreLoading(true)
    try {
      setStoreData(await fetchMyStore())
    } catch {
      setStoreData(null)
    } finally {
      setStoreLoading(false)
    }
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  const store = storeData?.store || null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'seller') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Store className="size-8 text-primary" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Seller dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Your account is a <span className="font-medium capitalize text-foreground">{user.role}</span>. Only approved
          sellers can access the seller dashboard.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate('/')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
            Back to storefront
          </button>
          <button onClick={() => navigate('/register/seller')} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Apply as a seller
          </button>
        </div>
      </div>
    )
  }

  const storeStatus = store ? STORE_STATUS_META[store.status] : null

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav className="space-y-0.5 rounded-2xl border border-border bg-card p-2.5 shadow-card">
              <div className="mb-2 flex items-center gap-2.5 border-b border-border px-2 pb-3">
                <Avatar name={store?.storeName || user.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{store?.storeName || user.name}</p>
                  {store && storeStatus && (
                    <Badge variant={storeStatus.variant} className="mt-0.5 px-1.5 py-0 text-[10px]">
                      {storeStatus.label}
                    </Badge>
                  )}
                </div>
              </div>
              <NavItems />
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {/* Mobile nav */}
          <nav
            className="-mx-4 mb-5 overflow-x-auto border-b border-border bg-background/80 px-4 pb-2 backdrop-blur lg:hidden"
            aria-label="Seller sections"
          >
            <div className="flex min-w-max gap-1">
              <NavItems onNavigate={undefined} className="rounded-full px-3.5 py-1.5" />
            </div>
          </nav>

          {/* Store not approved banner */}
          {store && store.status !== 'approved' && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-700" />
              <div>
                <p className="font-semibold text-warning-800">
                  Your store is {store.status === 'rejected' ? 'not approved' : 'pending approval'}.
                </p>
                <p className="text-warning-700/80">
                  {store.status === 'rejected'
                    ? `Reason: ${store.rejectionReason || 'Not shared by the platform admin.'}`
                    : 'The platform admin will review your application. Products can only be listed once approved.'}
                </p>
              </div>
            </div>
          )}

          {/* Status banner shown while resolving the store */}
          <AnimatePresence>
            {storeLoading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 text-sm text-muted-foreground"
              >
                Loading store…
              </motion.p>
            )}
          </AnimatePresence>

          <Outlet context={{ store, storeLoading, reload }} />
        </div>
      </div>
    </div>
  )
}
