import { Link } from 'react-router-dom'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { Badge } from '../ui/Badge.jsx'
import { StatusBadge } from '../account/StatusBadge.jsx'
import { TICKET_STATUS_META, TICKET_CATEGORY_META, TICKET_PRIORITY_META } from '../../lib/status.js'

export function TicketCard({ ticket, basePath }) {
  const category = TICKET_CATEGORY_META[ticket.category] || { label: ticket.category, variant: 'neutral' }
  const priority = TICKET_PRIORITY_META[ticket.priority] || { label: ticket.priority, variant: 'neutral' }
  const lastMessage = ticket.messages?.[ticket.messages.length - 1]

  return (
    <Link
      to={`${basePath}/${ticket._id}`}
      className="block rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{ticket.subject}</p>
            <Badge variant={category.variant}>{category.label}</Badge>
            <Badge variant={priority.variant}>{priority.label}</Badge>
            <StatusBadge status={ticket.status} meta={TICKET_STATUS_META} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {ticket.customerId?.name} · {ticket.customerId?.email}
            {ticket.orderId?.orderNumber ? ` · Order ${ticket.orderId.orderNumber}` : ''} ·{' '}
            {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {ticket.assignedTo && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Assigned: {ticket.assignedTo.name}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" /> {ticket.messages?.length || 0}
          </span>
          {lastMessage && <span className="line-clamp-1 max-w-[220px] text-right text-[11px] text-muted-foreground">{lastMessage.senderName}: {lastMessage.message}</span>}
          <ArrowRight className="size-4 text-primary" />
        </div>
      </div>
    </Link>
  )
}