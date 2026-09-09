import { useState } from 'react'
import { CheckCircle2, Inbox, Play, RotateCcw } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchTickets, fetchAgents, assignTicket, updateTicketStatus } from '../../services/admin.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Textarea } from '../../components/ui/Textarea.jsx'
import { cn } from '../../lib/utils.js'

const TICKET_STATUS = {
  open: { label: 'Open', variant: 'warning' },
  in_progress: { label: 'In progress', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'neutral' },
}

const CATEGORY_META = {
  dispute: { label: 'Dispute', variant: 'danger' },
  order_issue: { label: 'Order issue', variant: 'warning' },
  refund: { label: 'Refund', variant: 'secondary' },
  general: { label: 'General', variant: 'neutral' },
}

const PRIORITY_META = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'danger' },
}

const TABS = [
  { key: 'dispute', label: 'Disputes' },
  { key: 'order_issue', label: 'Order issues' },
  { key: 'refund', label: 'Refunds' },
  { key: 'general', label: 'General' },
]

export default function AdminDisputes() {
  const { toast } = useToast()
  const [tab, setTab] = useState('dispute')
  const { data: tickets, loading, refetch } = useFetch(() => fetchTickets({ category: tab }), [tab])
  const { data: agents } = useFetch(fetchAgents)
  const [resolveTarget, setResolveTarget] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const setStatus = async (ticket, status, resolutionNote) => {
    setBusy(true)
    try {
      await updateTicketStatus(ticket._id, { status, ...(resolutionNote ? { resolutionNote } : {}) })
      toast({ title: `Ticket ${status.replace('_', ' ')}`, description: ticket.subject, variant: status === 'closed' || status === 'resolved' ? 'success' : 'info' })
      setResolveTarget(null)
      setNote('')
      refetch()
    } catch (error) {
      toast({ title: 'Could not update ticket', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleAssign = async (ticket, supportAgentId) => {
    if (!supportAgentId) return
    try {
      await assignTicket(ticket._id, supportAgentId)
      toast({ title: 'Ticket assigned', description: `${ticket.subject} assigned to an agent.`, variant: 'success' })
      refetch()
    } catch (error) {
      toast({ title: 'Could not assign ticket', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <div>
      <PageIntro title="Disputes & support" subtitle="Resolve customer issues — order disputes, refunds and general queries." />

      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-card">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              tab === item.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : tickets?.length ? (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const category = CATEGORY_META[ticket.category] || { label: ticket.category, variant: 'neutral' }
            const priority = PRIORITY_META[ticket.priority] || { label: ticket.priority, variant: 'neutral' }
            return (
              <article key={ticket._id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{ticket.subject}</p>
                      <Badge variant={category.variant}>{category.label}</Badge>
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                      <StatusBadge status={ticket.status} meta={TICKET_STATUS} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ticket.customerId?.name} · {ticket.customerId?.email}
                      {ticket.orderId?.orderNumber ? ` · Order ${ticket.orderId.orderNumber}` : ''} ·{' '}
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
                    {ticket.resolutionNote && (
                      <p className="mt-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success-700">
                        <span className="font-semibold">Resolution:</span> {ticket.resolutionNote}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex gap-2">
                      {ticket.status === 'open' && (
                        <>
                          <Button size="sm" disabled={busy} onClick={() => setStatus(ticket, 'in_progress')}><Play /> Start</Button>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(ticket, 'closed')}>Close</Button>
                        </>
                      )}
                      {ticket.status === 'in_progress' && (
                        <>
                          <Button size="sm" variant="success" disabled={busy} onClick={() => { setNote(''); setResolveTarget(ticket) }}><CheckCircle2 /> Resolve</Button>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(ticket, 'closed')}>Close</Button>
                        </>
                      )}
                      {ticket.status === 'resolved' && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(ticket, 'closed')}>Close ticket</Button>
                      )}
                      {ticket.status === 'closed' && (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus(ticket, 'open')}><RotateCcw /> Reopen</Button>
                      )}
                    </div>
                    <Select
                      value={ticket.assignedTo?._id || ''}
                      onChange={(event) => handleAssign(ticket, event.target.value)}
                      className="w-44"
                    >
                      <option value="">{ticket.assignedTo?.name || 'Assign to agent…'}</option>
                      {(agents || []).map((agent) => (
                        <option key={agent._id} value={agent._id}>{agent.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Inbox className="size-6" /></span>
          <h2 className="text-base font-semibold">No {tab === 'dispute' ? 'disputes' : 'tickets'} here</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Customer-raised issues will appear here for handling.</p>
        </div>
      )}

      <Modal
        open={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        title="Resolve ticket"
        description={`"${resolveTarget?.subject}" — note the resolution for the customer.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>Cancel</Button>
            <Button variant="success" loading={busy} onClick={() => setStatus(resolveTarget, 'resolved', note.trim())}>
              <CheckCircle2 /> Mark resolved
            </Button>
          </>
        }
      >
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="What was the outcome? e.g. Refund of ₹1,398 processed to the customer's bank." autoFocus />
      </Modal>
    </div>
  )
}