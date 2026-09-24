import { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Banknote,
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  PackagePlus,
  RotateCcw,
  Store,
  TriangleAlert,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { SessionLoading } from '../auth/SessionLoading.jsx'
import { IdentityBlock, RoleDenied, RoleShell } from '../layout/RoleShell.jsx'
import { BandChip } from '../layout/WorkspaceHeader.jsx'
import { Badge } from '../ui/Badge.jsx'
import { fetchMyStore } from '../../services/seller.js'
import { buttonVariants } from '../ui/Button.jsx'
import { cn } from '../../lib/utils.js'
import { layout } from '../../design/context.js'

const NAV_ITEMS = [
  { to: '/seller', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/seller/store', label: 'Store profile', icon: Store, end: false },
  { to: '/seller/products', label: 'Products', icon: Package, end: false },
  { to: '/seller/products/new', label: 'Add product', icon: PackagePlus, end: false },
  { to: '/seller/inventory', label: 'Inventory', icon: Boxes, end: false },
  { to: '/seller/orders', label: 'Orders', icon: ClipboardList, end: false },
  { to: '/seller/returns', label: 'Returns', icon: RotateCcw, end: false },
  { to: '/seller/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/seller/earnings', label: 'Earnings', icon: Banknote, end: false },
]

const STORE_STATUS_META = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending review', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'danger' },
}

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default function SellerLayout() {
  const { user, authReady, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [storeData, setStoreData] = useState(null)
  const [storeLoading, setStoreLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    setStoreLoading(true)
    try {
      const data = await fetchMyStore()
      setStoreData(data)
      // The role cached in this browser can lag behind an approval made in
      // another tab or browser, so let an approved store settle it.
      if (data?.store?.status === 'approved' && user.role !== 'seller') {
        await refreshUser()
      }
    } catch {
      setStoreData(null)
    } finally {
      setStoreLoading(false)
    }
  }, [user, refreshUser])

  useEffect(() => {
    reload()
  }, [reload])

  const store = storeData?.store || null

  // A token with no cached user yet is still being resolved, so don't bounce
  // the visitor to the login page prematurely.
  if (!authReady && !user) {
    return <SessionLoading label="Loading your seller dashboard…" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Wait for the store lookup too: a freshly approved seller can still have
  // "customer" cached in this browser, so deciding now would wrongly lock them
  // out of the dashboard they just earned.
  if (storeLoading && !store) {
    return <SessionLoading label="Loading your seller dashboard…" />
  }

  if (user.role !== 'seller') {
    return (
      <RoleDenied
        icon={Store}
        title="Seller dashboard"
        actions={
          <>
            <button onClick={() => navigate('/')} className={layout.outlineButton}>
              Back to storefront
            </button>
            <button
              onClick={() => navigate('/register/seller')}
              className={cn(buttonVariants({ variant: 'default' }), 'bg-indigo-600 hover:bg-indigo-700')}
            >
              Apply as a seller
            </button>
          </>
        }
      >
        Your account is a <span className="font-semibold text-slate-900 capitalize">{user.role}</span>
        . Only approved sellers can access the seller dashboard.
      </RoleDenied>
    )
  }

  const storeStatus = store ? STORE_STATUS_META[store.status] : null
  const isApproved = store?.status === 'approved'

  return (
    <RoleShell
      role="seller"
      icon={Store}
      navLabel="Seller sections"
      navItems={NAV_ITEMS}
      identity={
        <IdentityBlock
          initials={initialsOf(store?.storeName || user.name)}
          name={store?.storeName || user.name}
          badge={
            storeStatus && (
              <Badge variant={storeStatus.variant} className="mt-1 px-1.5 py-0 text-[10px]">
                {storeStatus.label}
              </Badge>
            )
          }
          subtitle={store ? null : 'Your storefront'}
        />
      }
      workspace="Seller workspace"
      title={store?.storeName || `Hi ${user.name.split(' ')[0]}`}
      hint={
        store
          ? `${isApproved ? 'Live on the marketplace' : 'Not visible to shoppers yet'} · ${user.email}`
          : 'List, price and fulfil your catalogue'
      }
      chips={
        storeStatus && (
          <BandChip icon={isApproved ? Store : TriangleAlert}>{storeStatus.label}</BandChip>
        )
      }
      banner={
        <>
          {/* Store not approved banner */}
          {store && !isApproved && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <TriangleAlert className="size-4 text-amber-700" />
              </span>
              <div>
                <p className="font-semibold text-amber-900">
                  Your store is {store.status === 'rejected' ? 'not approved' : 'pending approval'}.
                </p>
                <p className="mt-0.5 text-amber-700">
                  {store.status === 'rejected'
                    ? `Reason: ${store.rejectionReason || 'Not shared by the platform admin.'}`
                    : 'The platform admin will review your application. Products can only be listed once approved.'}
                </p>
              </div>
            </div>
          )}

          {/* Status line shown while resolving the store */}
          <AnimatePresence>
            {storeLoading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 text-sm text-slate-500"
              >
                Loading store…
              </motion.p>
            )}
          </AnimatePresence>
        </>
      }
      onSignOut={() => {
        logout()
        navigate('/')
      }}
    >
      <Outlet context={{ store, storeLoading, reload }} />
    </RoleShell>
  )
}
