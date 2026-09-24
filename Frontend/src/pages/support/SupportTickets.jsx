import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { TicketCard } from '../../components/support/TicketCard.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchTickets } from '../../services/support.js'
import { Select } from '../../components/ui/Select.jsx'
import { cn } from '../../lib/utils.js'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
]

export default function SupportTickets() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || ''
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')

  const filters = {}
  if (status) filters.status = status
  if (priority) filters.priority = priority
  if (category) filters.category = category

  const { data: tickets, loading } = useFetch(() => fetchTickets(filters), [status, priority, category])

  const setStatus = (key) => {
    const next = new URLSearchParams(searchParams)
    if (key) next.set('status', key)
    else next.delete('status')
    setSearchParams(next, { replace: true })
  }

  return (
    <div>
      <PageIntro title="Ticket queue" subtitle={`${tickets?.length ?? 0} ticket${tickets?.length === 1 ? '' : 's'} match your filters.`} />

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {STATUS_TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setStatus(item.key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              status === item.key ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-cyan-50',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Priority + category filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-40">
          <option value="">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </Select>
        <Select value={category} onChange={(event) => setCategory(event.target.value)} className="w-44">
          <option value="">All categories</option>
          <option value="dispute">Disputes</option>
          <option value="order_issue">Order issues</option>
          <option value="refund">Refund requests</option>
          <option value="general">General</option>
        </Select>
        {(priority || category || status) && (
          <button
            onClick={() => {
              setPriority('')
              setCategory('')
              setStatus('')
            }}
            className="text-xs font-medium text-cyan-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : tickets?.length ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} basePath="/support/tickets" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><Inbox className="size-6" /></span>
          <h2 className="text-base font-semibold">No tickets match</h2>
          <p className="max-w-sm text-sm text-slate-500">Try a different status, priority or category filter.</p>
        </div>
      )}
    </div>
  )
}