import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Compass,
  Headset,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  UserRound,
  X,
} from 'lucide-react'
import { BellRing } from 'lucide-react'
import { cn, isPlaceholderImage } from '../../lib/utils.js'
import { NotificationBell } from './NotificationBell.jsx'
import { buttonVariants } from '../ui/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { ROLES } from '../../design/context.js'
import { formatPrice } from '../../lib/format.js'
import api from '../../services/api.js'

const ROLE_HOME = {
  seller: { to: '/seller', label: 'Seller Dashboard', icon: Store },
  admin: { to: '/admin', label: 'Admin Console', icon: ShieldCheck },
  support: { to: '/support', label: 'Support Desk', icon: Headset },
  delivery: { to: '/delivery', label: 'Delivery Run', icon: Truck },
}

const CATEGORY_NAV = [
  { label: 'All Products', to: '/products' },
  { label: 'Electronics', to: '/products?search=electronics' },
  { label: 'Fashion', to: '/products?search=fashion' },
  { label: 'Home & Living', to: '/products?search=home' },
  { label: 'Beauty', to: '/products?search=beauty' },
  { label: 'Sports', to: '/products?search=sports' },
]

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative flex size-9.5 items-center justify-center rounded-xl bg-[#0F766E] text-white shadow-[0_4px_16px_rgba(15,118,110,0.4)] transition-transform duration-300 group-hover:scale-105">
        <ShoppingBag className="size-5 text-[#FFE3D8]" />
        <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#FF6B6B] ring-2 ring-[#102A2A]" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight text-white">
        Shop<span className="text-[#FF6B6B]">Sphear</span>
      </span>
    </Link>
  )
}

/** Storefront-wide search with real-time interactive auto-complete suggestions */
function NavSearch({ className }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const query = value.trim()
    if (query.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/product-api/products', {
          params: { search: query, limit: 5 },
        })
        setSuggestions(data.payload?.products || [])
        setOpenDropdown(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [value])

  const submit = (event) => {
    event?.preventDefault()
    const query = value.trim()
    setOpenDropdown(false)
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
  }

  const handleSelect = (product) => {
    setOpenDropdown(false)
    setValue('')
    navigate(`/product/${product._id}`)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form
        onSubmit={submit}
        role="search"
        className="group flex h-10 w-full items-center gap-2 rounded-xl border border-[#174747] bg-[#174747]/70 px-3.5 text-white transition-all focus-within:border-[#0F766E] focus-within:bg-[#174747] focus-within:shadow-[0_0_0_3px_rgba(15,118,110,0.25)]"
      >
        <Search className="size-4 shrink-0 text-slate-300 transition-colors group-focus-within:text-[#FF6B6B]" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpenDropdown(true)}
          placeholder="Search products, brands, or collections…"
          aria-label="Search products"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('')
              setSuggestions([])
              setOpenDropdown(false)
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      {/* Interactive suggestions dropdown */}
      <AnimatePresence>
        {openDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-2xl border border-[#174747] bg-[#102A2A] p-2 text-white shadow-2xl ring-1 ring-black/40 backdrop-blur-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center p-4 text-xs text-slate-400">
                Searching ShopSphear...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-1">
                <p className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Suggested Products
                </p>
                {suggestions.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[#174747]"
                  >
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {!isPlaceholderImage(item.images?.[0]) ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500">
                          <ShoppingBag className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.brand || 'ShopSphear'} •{' '}
                        <span className="font-bold text-[#FF6B6B]">{formatPrice(item.price)}</span>
                      </p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-[#174747] pt-1">
                  <button
                    onClick={submit}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-[#FF6B6B] hover:bg-[#174747]"
                  >
                    View all results for &quot;{value}&quot; →
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching products found. Press Enter to search all.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RoleShortcut({ role }) {
  const home = ROLE_HOME[role]
  if (!home) return null
  const Icon = home.icon
  return (
    <Link
      to={home.to}
      className="hidden items-center gap-1.5 rounded-xl bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#115E59] lg:inline-flex"
    >
      <Icon className="size-3.5" /> {home.label}
    </Link>
  )
}

export function Navbar() {
  const { user, logout } = useAuth()
  const { count, openDrawer } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handler = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load wishlist count
  useEffect(() => {
    if (!user) {
      setWishlistCount(0)
      return
    }
    api
      .get('/wishlist-api/wishlist')
      .then(({ data }) => setWishlistCount(data.payload?.products?.length || 0))
      .catch(() => setWishlistCount(0))
  }, [user])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    setMenuOpen(false)
    navigate('/')
  }

  const accountLinks = user
    ? [
        { label: 'Profile Settings', to: '/account/profile', icon: UserRound },
        { label: 'My Orders', to: '/account/orders', icon: Package },
        { label: 'Saved Wishlist', to: '/account/wishlist', icon: Heart },
        { label: 'Returns & Refunds', to: '/account/returns', icon: RotateCcw },
        { label: 'Notifications', to: '/account/notifications', icon: BellRing },
      ]
    : []

  return (
    <header className="sticky top-0 z-40 border-b border-[#174747] bg-[#102A2A] text-white shadow-md">
      {/* Coupon strip — SAVE10 is a live coupon (10% off, min order ₹100) */}
      <div className="hidden border-b border-[#174747]/60 bg-[#0c1e1e] px-4 py-1 text-center text-[11px] font-medium text-slate-300 sm:block">
        <span className="text-[#FF6B6B]">✦ Save 10%:</span> Use coupon code{' '}
        <strong className="text-white">SAVE10</strong> at checkout on orders over ₹100.
      </div>

      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        <Logo />

        {/* Category navigation - desktop */}
        <nav className="ml-2 hidden items-center gap-0.5 xl:flex">
          {CATEGORY_NAV.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.to === '/products'}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors',
                  isActive
                    ? 'bg-[#174747] text-white'
                    : 'text-slate-300 hover:bg-[#174747]/60 hover:text-white',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Search bar */}
        <NavSearch className="ml-auto hidden w-80 md:flex lg:w-96" />

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {user && user.role !== 'customer' && <RoleShortcut role={user.role} />}

          {/* Sell CTA button */}
          <Link
            to="/register/seller"
            className="hidden items-center gap-1.5 rounded-xl border border-[#0F766E] px-3 py-1.5 text-xs font-semibold text-[#FFE3D8] transition hover:bg-[#0F766E] hover:text-white sm:flex"
          >
            <Store className="size-3.5" /> Sell on ShopSphear
          </Link>

          {/* Notifications */}
          <NotificationBell />

          {/* Wishlist button */}
          <Link
            to="/account/wishlist"
            aria-label="Wishlist"
            className="relative flex size-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-[#174747] hover:text-white"
          >
            <Heart className="size-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[#FF6B6B] text-[10px] font-bold text-white shadow-sm">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart button (Opens Cart Drawer) */}
          <button
            onClick={openDrawer}
            aria-label={`Cart, ${count} items`}
            className="relative flex size-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-[#174747] hover:text-white"
          >
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FF6B6B] px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-[#102A2A]"
              >
                {count > 99 ? '99+' : count}
              </motion.span>
            )}
          </button>

          {/* User Account / Sign in */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-[#174747] bg-[#174747]/80 py-1 pr-2.5 pl-1 transition hover:border-[#0F766E]"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-[#0F766E] text-xs font-bold text-white">
                  {(user.name || 'U')[0].toUpperCase()}
                </span>
                <span className="hidden text-xs font-semibold text-white sm:inline">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown
                  className={cn(
                    'size-3.5 text-slate-400 transition-transform',
                    userMenuOpen && 'rotate-180',
                  )}
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[#174747] bg-[#102A2A] p-2 shadow-2xl ring-1 ring-black/40"
                  >
                    <div className="rounded-xl bg-[#174747] p-3">
                      <p className="truncate text-xs font-bold text-white">{user.name}</p>
                      <p className="truncate text-[11px] text-slate-300">{user.email}</p>
                      <span className="mt-1 inline-block rounded-md bg-[#0F766E] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        Role: {user.role}
                      </span>
                    </div>

                    <div className="mt-1.5 space-y-0.5">
                      {accountLinks.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-[#174747] hover:text-white"
                          >
                            <Icon className="size-4 text-slate-400" /> {item.label}
                          </Link>
                        )
                      })}

                      {/* Workspaces quick switcher */}
                      <div className="border-t border-[#174747] pt-1">
                        <p className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          Platform Dashboards
                        </p>
                        <Link
                          to="/seller"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:bg-[#174747] hover:text-white"
                        >
                          <Store className="size-3.5 text-indigo-400" /> Seller Dashboard
                        </Link>
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:bg-[#174747] hover:text-white"
                        >
                          <ShieldCheck className="size-3.5 text-amber-400" /> Admin Console
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:bg-[#174747] hover:text-white"
                        >
                          <Headset className="size-3.5 text-cyan-400" /> Support Desk
                        </Link>
                        <Link
                          to="/delivery"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:bg-[#174747] hover:text-white"
                        >
                          <Truck className="size-3.5 text-emerald-400" /> Delivery Run
                        </Link>
                      </div>
                    </div>

                    <div className="my-1 h-px bg-[#174747]" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#FF6B6B] transition hover:bg-[#174747]"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#174747] hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-[#FF6B6B] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#ff5252]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex size-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-[#174747] hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-[#174747] bg-[#102A2A] px-4 py-4 md:hidden"
          >
            <NavSearch className="mb-4 w-full" />

            <div className="space-y-1">
              <p className="px-2 py-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Categories
              </p>
              {CATEGORY_NAV.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-200 hover:bg-[#174747] hover:text-white"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="mt-4 border-t border-[#174747] pt-3">
              <Link
                to="/register/seller"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-[#0F766E] px-3 py-2.5 text-xs font-bold text-white"
              >
                <Store className="size-4" /> Open a Store on ShopSphear
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
