import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellRing, CheckCheck, Package, Ticket, Truck, Wallet, Store, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications.js'

// Icon per notification type, so the feed is scannable at a glance.
const TYPE_ICON = {
  order: Package,
  delivery: Truck,
  ticket: Ticket,
  product: Store,
  seller: Store,
  payout: Wallet,
  system: Sparkles,
}

const POLL_MS = 45_000

const relativeTime = (value) => {
  const then = new Date(value).getTime()
  const diff = Date.now() - then
  const minutes = Math.round(diff / 60_000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  const loadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    try {
      setUnreadCount(await fetchUnreadCount())
    } catch {
      // A failed poll is not worth surfacing — the next tick retries.
    }
  }, [user])

  // Poll the count and refresh on focus/tab-return, which is when a stale badge
  // is most visible to the user.
  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    loadCount()
    const timer = setInterval(loadCount, POLL_MS)
    const onFocus = () => loadCount()
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [user, loadCount])

  // Close on outside click
  useEffect(() => {
    const handler = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications({ limit: 8 })
      setItems(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) loadFeed()
  }

  const openNotification = async (item) => {
    setOpen(false)

    // Optimistic: the badge and row clear immediately, the request catches up.
    if (!item.readAt) {
      setItems((current) =>
        current.map((n) => (n._id === item._id ? { ...n, readAt: new Date().toISOString() } : n)),
      )
      setUnreadCount((count) => Math.max(0, count - 1))
      markNotificationRead(item._id).catch(() => {})
    }

    if (item.link) navigate(item.link)
  }

  const markAllRead = async () => {
    setItems((current) => current.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })))
    setUnreadCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      loadCount()
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className={cn(
          'relative flex size-10 items-center justify-center rounded-xl transition',
          open ? 'bg-[#174747] text-white' : 'text-slate-300 hover:bg-[#174747] hover:text-white',
        )}
      >
        {unreadCount > 0 ? <BellRing className="size-5" /> : <Bell className="size-5" />}
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FF6B6B] px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-[#102A2A]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[21rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#174747] bg-[#102A2A] text-white shadow-2xl ring-1 ring-black/40"
          >
            <div className="flex items-center justify-between border-b border-[#174747] px-4 py-3">
              <p className="text-xs font-bold tracking-wide uppercase">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#FF6B6B] hover:text-[#ff8888]"
                >
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-[#174747]/60" />
                  ))}
                </div>
              ) : items.length ? (
                items.map((item) => {
                  const Icon = TYPE_ICON[item.type] || Sparkles
                  return (
                    <button
                      key={item._id}
                      onClick={() => openNotification(item)}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-[#174747]/60 px-4 py-3 text-left transition last:border-0 hover:bg-[#174747]',
                        !item.readAt && 'bg-[#174747]/40',
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/25 text-[#7fd6cd]">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-white">{item.title}</span>
                          {!item.readAt && <span className="mt-1 size-2 shrink-0 rounded-full bg-[#FF6B6B]" />}
                        </span>
                        {item.message && (
                          <span className="mt-0.5 block line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                            {item.message}
                          </span>
                        )}
                        <span className="mt-1 block text-[10px] text-slate-500">{relativeTime(item.createdAt)}</span>
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-10 text-center">
                  <Bell className="mx-auto size-6 text-slate-500" />
                  <p className="mt-2 text-xs text-slate-400">You are all caught up.</p>
                </div>
              )}
            </div>

            <Link
              to="/account/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-[#174747] px-4 py-3 text-center text-[11px] font-semibold text-[#FF6B6B] hover:bg-[#174747]"
            >
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell
