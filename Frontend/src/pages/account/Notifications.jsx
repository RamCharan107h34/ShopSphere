import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Package, Sparkles, Store, Ticket, Trash2, Truck, Wallet } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useToast } from '../../components/ui/toast.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications.js'
import { getErrorMessage } from '../../services/api.js'
import { cn } from '../../lib/utils.js'

const TYPE_ICON = {
  order: Package,
  delivery: Truck,
  ticket: Ticket,
  product: Store,
  seller: Store,
  payout: Wallet,
  system: Sparkles,
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
]

export default function Notifications() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)

  const { data, loading, refetch } = useFetch(
    () => fetchNotifications({ page, limit: 15, unreadOnly: filter === 'unread' }),
    [page, filter],
  )

  useEffect(() => {
    setPage(1)
  }, [filter])

  const notifications = data?.notifications || []
  const totalPages = data?.totalPages || 1
  const unreadCount = data?.unreadCount || 0

  const open = useCallback(
    async (item) => {
      if (!item.readAt) {
        try {
          await markNotificationRead(item._id)
          refetch()
        } catch {
          // Opening the target still works even if the read receipt failed.
        }
      }
      if (item.link) navigate(item.link)
    },
    [navigate, refetch],
  )

  const markAll = async () => {
    try {
      await markAllNotificationsRead()
      toast({ title: 'All notifications marked read', variant: 'success' })
      refetch()
    } catch (error) {
      toast({ title: 'Could not update', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const remove = async (item) => {
    setBusyId(item._id)
    try {
      await deleteNotification(item._id)
      refetch()
    } catch (error) {
      toast({ title: 'Could not delete', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageIntro
        title="Notifications"
        subtitle="Order, delivery, return, payout and support updates land here."
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck /> Mark all read
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 transition',
              filter === option.key
                ? 'bg-teal text-white ring-teal'
                : 'bg-white text-slate-600 ring-slate-200 hover:text-slate-900',
            )}
          >
            {option.label}
            {option.key === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((item) => {
            const Icon = TYPE_ICON[item.type] || Sparkles
            return (
              <article
                key={item._id}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm transition',
                  item.readAt ? 'border-slate-200' : 'border-teal/30 bg-teal/[0.03]',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
                  <Icon className="size-5" />
                </span>

                <button onClick={() => open(item)} className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{item.title}</span>
                    {!item.readAt && <span className="size-2 shrink-0 rounded-full bg-coral" />}
                  </span>
                  {item.message && <p className="mt-0.5 text-sm text-slate-500">{item.message}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </button>

                <button
                  onClick={() => remove(item)}
                  disabled={busyId === item._id}
                  aria-label="Delete notification"
                  className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </article>
            )
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Bell className="size-6" />
          </span>
          <h2 className="text-base font-semibold text-slate-900">Nothing here yet</h2>
          <p className="max-w-sm text-sm text-slate-500">
            {filter === 'unread'
              ? 'You have read everything. Switch to All to see your history.'
              : 'Order confirmations, delivery updates and support replies will show up here.'}
          </p>
        </div>
      )}
    </div>
  )
}
