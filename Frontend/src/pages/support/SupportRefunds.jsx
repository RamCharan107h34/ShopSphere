import { useState } from 'react'
import { Banknote } from 'lucide-react'
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

export default function SupportRefunds() {
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  const filters = { category: 'refund' }
  if (status) filters.status = status
  if (priority) filters.priority = priority

  const { data: tickets, loading } = useFetch(() => fetchTickets(filters), [status, priority])

  return (
    <div>
      <PageIntro title="Refund requests" subtitle="Refund queries and payment issues — verify and process." />

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
        {STATUS_TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setStatus(item.key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              status === item.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <Select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-40">
          <option value="">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : tickets?.length ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} basePath="/support/tickets" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Banknote className="size-6" /></span>
          <h2 className="text-base font-semibold">No refund requests here</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Refund queries raised by customers will appear here.</p>
        </div>
      )}
    </div>
  )
}