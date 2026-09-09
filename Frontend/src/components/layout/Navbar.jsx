import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Headset, Heart, LayoutDashboard, LogOut, Menu, Package, RotateCcw, ShieldCheck, ShoppingBag, ShoppingCart, Store, Truck, UserRound, X } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { buttonVariants } from '../ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'

function CartLink({ className }) {
  const { count } = useCart()
  return (
    <Link
      to="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : 'Cart'}
      className={cn(
        'relative flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </Link>
  )
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <ShoppingBag className="size-4" />
      </span>
      <span className="text-lg font-bold tracking-tight">
        Shop<span className="text-primary">Sphere</span>
      </span>
    </Link>
  )
}

function Avatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
      {initials}
    </span>
  )
}

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Close the user dropdown on outside click
  useEffect(() => {
    const handler = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    setMenuOpen(false)
    navigate('/')
  }

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Sell on ShopSphere', to: '/register/seller', icon: Store },
  ]

  const accountLinks = user
    ? [
        { label: 'Profile', to: '/account/profile', icon: UserRound },
        { label: 'My orders', to: '/account/orders', icon: Package },
        { label: 'Wishlist', to: '/account/wishlist', icon: Heart },
        { label: 'Returns', to: '/account/returns', icon: RotateCcw },
        ...(user.role === 'seller'
          ? [{ label: 'Seller dashboard', to: '/seller', icon: LayoutDashboard }]
          : []),
        ...(user.role === 'admin'
          ? [{ label: 'Admin dashboard', to: '/admin', icon: ShieldCheck }]
          : []),
        ...(user.role === 'support'
          ? [{ label: 'Support desk', to: '/support', icon: Headset }]
          : []),
        ...(user.role === 'delivery'
          ? [{ label: 'Delivery dashboard', to: '/delivery', icon: Truck }]
          : []),
      ]
    : []

  const closeMenus = () => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />

          {/* Desktop links */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-1.5 md:flex">
          <CartLink />
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 transition-colors hover:bg-accent"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <Avatar name={user.name} />
                <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-elevated"
                  >
                    <div className="border-b border-border px-3 py-2.5">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="mt-1 space-y-0.5 border-t border-border pt-1">
                      {accountLinks.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.to}
                            role="menuitem"
                            to={item.to}
                            onClick={closeMenus}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                          >
                            <Icon className="size-4 text-muted-foreground" /> {item.label}
                          </Link>
                        )
                      })}
                    </div>
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Sign in
              </Link>
              <Link to="/register" className={buttonVariants({ variant: 'default', size: 'sm' })}>
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {user && (
                <div className="mb-2 flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Avatar name={user.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              {links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <div className="space-y-0.5 border-t border-border pt-1">
                  {accountLinks.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        <Icon className="size-4 text-muted-foreground" /> {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
              <Link
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <ShoppingCart className="size-4" /> Cart
              </Link>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              ) : (
                <div className="flex gap-2 pt-3">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className={cn(buttonVariants({ variant: 'default' }), 'flex-1')}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
