import { useEffect, useState } from 'react'
import { History, Search, ShieldCheck } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchAuditActions, fetchAuditLogs } from '../../services/settlements.js'
import { cn } from '../../lib/utils.js'

const PAGE_SIZE = 25

// Colour-coded by the verb family, so a scan of the table reads as a story:
// approvals green, destructive actions red, moderation amber.
const actionTone = (action = '') => {
  if (action.endsWith('.approve') || action.endsWith('.paid') || action.endsWith('.create')) return 'success'
  if (action.includes('reject') || action.includes('delete') || action.includes('cancel')) return 'danger'
  if (action.startsWith('product.') || action.startsWith('ticket.')) return 'warning'
  return 'neutral'
}

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  // Debounced so typing in the box does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [action])

  const { data: actions } = useFetch(fetchAuditActions)
  const { data, loading } = useFetch(
    () => fetchAuditLogs({ page, limit: PAGE_SIZE, search: debouncedSearch, action }),
    [page, debouncedSearch, action],
  )

  const logs = data?.logs || []
  const totalCount = data?.totalCount || 0
  const totalPages = data?.totalPages || 1

  return (
    <div>
      <PageIntro
        title="Audit log"
        subtitle="Every admin-sensitive action — approvals, moderation, payouts, coupon and product changes — recorded with actor, target and time."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search description, actor or action…"
            className="pl-9"
            aria-label="Search audit log"
          />
        </div>

        <Select
          value={action}
          onChange={(event) => setAction(event.target.value)}
          aria-label="Filter by action"
          className="w-full sm:w-64"
        >
          <option value="">All actions</option>
          {(actions || []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        {totalCount} record{totalCount === 1 ? '' : 's'}
        {debouncedSearch && ` matching “${debouncedSearch}”`}
        {action && ` · action ${action}`}
      </p>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : logs.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{log.actorName || 'System'}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{log.actorRole || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={actionTone(log.action)}>{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">{log.targetType || '—'}</p>
                    <p className="font-mono text-[10px] text-slate-400">{log.targetId || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.description || '—'}
                    {!!log.metadata && Object.keys(log.metadata).length > 0 && (
                      <p className="mt-1 font-mono text-[10px] text-slate-400">
                        {Object.entries(log.metadata)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(' · ')}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className={cn('flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400')}>
            <History className="size-6" />
          </span>
          <h2 className="text-base font-semibold">No matching records</h2>
          <p className="max-w-sm text-sm text-slate-500">
            {debouncedSearch || action
              ? 'Try clearing the filters.'
              : 'Approving a seller, moderating a product or recording a payout will create the first entry.'}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="size-3.5" /> The trail is append-only: entries can never be edited or removed from the app.
      </p>
    </div>
  )
}
