import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Banknote, ClipboardList, Headset, Inbox, LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Badge } from '../ui/Badge.jsx'

const NAV_ITEMS = [
  { to: '/support', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/support/tickets', label: 'Tickets', icon: Inbox, end: false },
  { to: '/support/disputes', label: 'Disputes', icon: ClipboardList, end: false },
  { to: '/support/refunds', label: 'Refund requests', icon: Banknote, end: false },
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
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
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

export default function SupportLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'support') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Headset className="size-8 text-primary" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Support desk</h1>
        <p className="mt-2 text-muted-foreground">
          Your account is a <span className="font-medium capitalize text-foreground">{user.role}</span>. Only support
          agents and admins can access the support desk.
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
                  <Headset className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <Badge variant="secondary" className="mt-0.5 px-1.5 py-0 text-[10px]">
                    Support agent
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
          <nav
            className="-mx-4 mb-5 overflow-x-auto border-b border-border bg-background/80 px-4 pb-2 backdrop-blur lg:hidden"
            aria-label="Support sections"
          >
            <div className="flex min-w-max gap-1">
              <NavItems className="rounded-full px-3.5 py-1.5" />
            </div>
          </nav>
          <Outlet />
        </div>
      </div>
    </div>
  )
}