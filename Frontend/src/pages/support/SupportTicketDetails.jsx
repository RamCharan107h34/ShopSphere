import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Headset, Play, RotateCcw, Send, UserRound } from 'lucide-react'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchTicket, fetchAgents, assignTicket, updateTicketStatus, replyOnTicket } from '../../services/support.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Textarea } from '../../components/ui/Textarea.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { TICKET_STATUS_META, TICKET_CATEGORY_META, TICKET_PRIORITY_META } from '../../lib/status.js'
import { cn } from '../../lib/utils.js'

export default function SupportTicketDetails() {
  const { ticketId } = useParams()
  const { toast } = useToast()
  const { data: ticket, loading, refetch } = useFetch(() => fetchTicket(ticketId), [ticketId])
  const { data: agents } = useFetch(fetchAgents)

  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resolveTarget, setResolveTarget] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    setReply('')
    setNote('')
    setResolveTarget(false)
  }, [ticketId])

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
        <h2 className="text-base font-semibold">Ticket not found</h2>
        <p className="mt-1 text-sm text-slate-500">It may have been removed.</p>
      </div>
    )
  }

  const category = TICKET_CATEGORY_META[ticket.category] || { label: ticket.category, variant: 'neutral' }
  const priority = TICKET_PRIORITY_META[ticket.priority] || { label: ticket.priority, variant: 'neutral' }

  const setStatus = async (status, resolutionNote) => {
    setBusy(true)
    try {
      await updateTicketStatus(ticket._id, { status, ...(resolutionNote ? { resolutionNote } : {}) })
      toast({ title: `Ticket ${status.replace('_', ' ')}`, description: ticket.subject, variant: status === 'resolved' || status === 'closed' ? 'success' : 'info' })
      setResolveTarget(false)
      setNote('')
      refetch()
    } catch (error) {
      toast({ title: 'Could not update ticket', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleAssign = async (supportAgentId) => {
    if (!supportAgentId) return
    try {
      await assignTicket(ticket._id, supportAgentId)
      toast({ title: 'Ticket assigned', description: 'The agent will see it in their queue.', variant: 'success' })
      refetch()
    } catch (error) {
      toast({ title: 'Could not assign ticket', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const handleReply = async (event) => {
    event.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await replyOnTicket(ticket._id, reply.trim())
      toast({ title: 'Reply sent', description: 'The customer will see your message.', variant: 'success' })
      setReply('')
      refetch()
    } catch (error) {
      toast({ title: 'Could not send reply', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSending(false)
    }
  }

  const canStart = ticket.status === 'open'
  const canResolve = ticket.status === 'in_progress'
  const canClose = ['open', 'in_progress', 'resolved'].includes(ticket.status)
  const canReopen = ticket.status === 'closed'

  return (
    <div>
      <Link to="/support/tickets" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Back to queue
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{ticket.subject}</h1>
              <Badge variant={category.variant}>{category.label}</Badge>
              <Badge variant={priority.variant}>{priority.label}</Badge>
              <StatusBadge status={ticket.status} meta={TICKET_STATUS_META} />
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              {ticket.customerId?.name} · {ticket.customerId?.email}
              {ticket.customerId?.phone ? ` · ${ticket.customerId.phone}` : ''}
              {ticket.orderId?.orderNumber ? ` · Order ${ticket.orderId.orderNumber}` : ''} · Opened{' '}
              {new Date(ticket.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900/90">{ticket.description}</p>
            {ticket.resolutionNote && (
              <p className="mt-3 rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
                <span className="font-semibold">Resolution:</span> {ticket.resolutionNote}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {canStart && (
                <Button size="sm" disabled={busy} onClick={() => setStatus('in_progress')}><Play /> Start</Button>
              )}
              {canResolve && (
                <Button size="sm" variant="success" disabled={busy} onClick={() => { setNote(''); setResolveTarget(true) }}>
                  <CheckCircle2 /> Resolve
                </Button>
              )}
              {canClose && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus('closed')}>Close ticket</Button>
              )}
              {canReopen && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus('open')}><RotateCcw /> Reopen</Button>
              )}
            </div>
            <Select
              value={ticket.assignedTo?._id || ''}
              onChange={(event) => handleAssign(event.target.value)}
              className="w-full"
            >
              <option value="">{ticket.assignedTo?.name || 'Assign to agent…'}</option>
              {(agents || []).map((agent) => (
                <option key={agent._id} value={agent._id}>{agent.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold">Conversation · {ticket.messages?.length || 0} message{(ticket.messages?.length || 0) !== 1 ? 's' : ''}</h2>
        </div>
        <div className="space-y-4 px-5 py-5">
          {ticket.messages?.length ? (
            ticket.messages.map((message) => {
              const isAgent = ['support', 'admin'].includes(message.senderRole)
              return (
                <div key={message._id} className={cn('flex gap-3', isAgent && 'flex-row-reverse')}>
                  <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', isAgent ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-500')}>
                    {isAgent ? <Headset className="size-4" /> : <UserRound className="size-4" />}
                  </span>
                  <div className={cn('max-w-[75%]', isAgent && 'text-right')}>
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-900">{message.senderName}</span>
                      {message.senderRole ? ` · ${message.senderRole}` : ''} ·{' '}
                      {new Date(message.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <div className={cn('mt-1 rounded-xl px-4 py-2.5 text-sm leading-relaxed', isAgent ? 'rounded-tr-sm bg-cyan-50' : 'rounded-tl-sm bg-slate-50')}>
                      {message.message}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No messages yet — start the conversation below.</p>
          )}

          {/* Reply box */}
          <form onSubmit={handleReply} className="border-t border-slate-200 pt-4">
            <label className="mb-1.5 block text-sm font-medium">Reply to customer</label>
            <Textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Type your reply…" />
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" loading={sending} disabled={!reply.trim()}>
                <Send /> Send reply
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Resolve modal */}
      <Modal
        open={resolveTarget}
        onClose={() => setResolveTarget(false)}
        title="Resolve ticket"
        description="Record the outcome — the customer sees it as the resolution note."
        footer={
          <>
            <Button variant="outline" onClick={() => setResolveTarget(false)}>Cancel</Button>
            <Button variant="success" loading={busy} onClick={() => setStatus('resolved', note.trim())}>
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