import { useNavigate } from 'react-router-dom'
import { ArrowRight, CircleCheck, CircleX, Clock, Inbox, Play } from 'lucide-react'
import { PageIntro, StatCard } from '../../components/seller/PageIntro.jsx'
import { TicketCard } from '../../components/support/TicketCard.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchTickets } from '../../services/support.js'
import { TICKET_PRIORITY_META } from '../../lib/status.js'
import { Badge } from '../../components/ui/Badge.jsx'

export default function SupportDashboard() {
  const navigate = useNavigate()
  const { data: tickets, loading } = useFetch(() => fetchTickets({}))

  const counts = (tickets || []).reduce(
    (acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1
      return acc
    },
    { open: 0, in_progress: 0, resolved: 0, closed: 0 },
  )

  const priorities = (tickets || []).reduce(
    (acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
      return acc
    },
    { low: 0, medium: 0, high: 0 },
  )

  const recent = (tickets || []).slice(0, 5)

  return (
    <div>
      <PageIntro
        title="Support dashboard"
        subtitle="Your ticket queue at a glance — stay on top of customer issues."
        actions={
          <button onClick={() => navigate('/support/tickets')} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-px hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700">
            Open ticket queue <ArrowRight className="ml-1 inline size-3.5" />
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Inbox} label="Open" value={counts.open} hint="Awaiting first response" tone="warning" />
          <StatCard icon={Play} label="In progress" value={counts.in_progress} hint="Being worked on" tone="primary" />
          <StatCard icon={CircleCheck} label="Resolved" value={counts.resolved} hint="Outcome noted" tone="success" />
          <StatCard icon={CircleX} label="Closed" value={counts.closed} hint="Conversation ended" tone="neutral" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Recent tickets */}
        <section className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-18px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold">Recent tickets</h2>
            <button onClick={() => navigate('/support/tickets')} className="text-xs font-medium text-cyan-600 hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : recent.length ? (
            <div className="space-y-3 p-5">
              {recent.map((ticket) => (
                <TicketCard key={ticket._id} ticket={ticket} basePath="/support/tickets" />
              ))}
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No tickets yet.</p>
          )}
        </section>

        {/* Priority breakdown */}
        <section className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-18px_rgba(15,23,42,0.22)]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Clock className="size-4 text-cyan-600" />
            <h2 className="text-sm font-semibold">Priority load</h2>
          </div>
          <div className="space-y-4 px-5 py-5">
            {(['high', 'medium', 'low']).map((key) => {
              const meta = TICKET_PRIORITY_META[key]
              const count = priorities[key] || 0
              const max = Math.max(priorities.high, priorities.medium, priorities.low, 1)
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${key === 'high' ? 'bg-red-500' : key === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`}
                      style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <p className="pt-1 text-xs text-slate-500">
              {counts.open} open ticket{counts.open !== 1 ? 's' : ''} — triage high priority first.
            </p>
          </div>
        </section>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Ticket queue', to: '/support/tickets' },
          { label: 'Disputes', to: '/support/disputes' },
          { label: 'Refund requests', to: '/support/refunds' },
          { label: 'Open issues', to: '/support/tickets?status=open' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.to)}
            className="group rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:text-slate-900 hover:ring-cyan-200 hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.3)]"
          >
            {item.label} <ArrowRight className="float-right mt-0.5 size-3.5 text-slate-500" />
          </button>
        ))}
      </div>
    </div>
  )
}