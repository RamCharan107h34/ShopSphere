import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  ShieldCheck,
  Store,
  Tags,
  Ticket,
  Users,
} from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Badge } from '../ui/Badge.jsx'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/sellers', label: 'Sellers', icon: Store, end: false },
  { to: '/admin/categories', label: 'Categories', icon: Tags, end: false },
  { to: '/admin/products', label: 'Product moderation', icon: PackageSearch, end: false },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket, end: false },
  { to: '/admin/disputes', label: 'Disputes', icon: ClipboardList, end: false },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, end: false },
]

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

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="size-8 text-primary" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Platform admin</h1>
        <p className="mt-2 text-muted-foreground">
          Your account is a <span className="font-medium capitalize text-foreground">{user.role}</span>. Only platform
          admins can access the admin dashboard.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate('/')} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
            Back to storefront
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <nav className="space-y-0.5 rounded-2xl border border-border bg-card p-2.5 shadow-card">
              <div className="mb-2 flex items-center gap-2.5 border-b border-border px-2 pb-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <ShieldCheck className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <Badge variant="default" className="mt-0.5 px-1.5 py-0 text-[10px]">
                    Platform admin
                  </Badge>
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
            aria-label="Admin sections"
          >
            <div className="flex min-w-max gap-1">
              <NavItems className="rounded-full px-3.5 py-1.5" />
            </div>
          </nav>

          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  )
}