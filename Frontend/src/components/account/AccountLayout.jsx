import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Heart, LogOut, Package, RotateCcw, UserRound } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/account/profile', label: 'Profile', icon: UserRound, end: false },
  { to: '/account/orders', label: 'My orders', icon: Package, end: false },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart, end: false },
  { to: '/account/returns', label: 'Returns', icon: RotateCcw, end: false },
]

function Avatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
      {initials}
    </span>
  )
}

export default function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">My account</h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[230px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1 rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-3 border-b border-border px-2 pb-3">
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )
                  }
                >
                  <Icon className="size-4" /> {item.label}
                </NavLink>
              )
            })}

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Mobile nav (horizontal scroll) */}
        <nav className="-mx-4 mb-1 overflow-x-auto border-b border-border px-4 lg:hidden" aria-label="Account sections">
          <div className="flex min-w-max gap-1 pb-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                    )
                  }
                >
                  <Icon className="size-3.5" /> {item.label}
                </NavLink>
              )
            })}
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-rose-600">
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </nav>

        {/* Content */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
