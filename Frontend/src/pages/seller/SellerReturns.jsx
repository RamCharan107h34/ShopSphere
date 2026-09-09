import { useState } from 'react'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { Thumb } from '../../components/seller/Thumb.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchSellerReturns, updateReturnStatus } from '../../services/seller.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { formatPrice } from '../../lib/format.js'
import { RETURN_META } from '../../lib/status.js'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Textarea } from '../../components/ui/Textarea.jsx'

export default function SellerReturns() {
  const { toast } = useToast()
  const { data: returns, loading, refetch } = useFetch(fetchSellerReturns)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const update = async (returnItem, status, adminNote) => {
    setBusy(true)
    try {
      await updateReturnStatus(returnItem._id, { status, adminNote })
      toast({
        title: `Return ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'completed'}`,
        description: status === 'completed' ? 'Refund processed — item restocked automatically.' : undefined,
        variant: status === 'rejected' ? 'error' : 'success',
      })
      setRejectTarget(null)
      setNote('')
      refetch()
    } catch (error) {
      toast({ title: 'Could not update return', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title="Returns" subtitle="Review customer return requests. Completing a return restocks the item and records the refund." />

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : returns?.length ? (
        <div className="space-y-4">
          {returns.map((returnItem) => {
            const product = returnItem.productId
            return (
              <article key={returnItem._id} className="rounded-2xl border border-border bg-card shadow-card">
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <Thumb src={product?.images?.[0]} alt={product?.title} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{product?.title || 'Product'}</p>
                      <StatusBadge status={returnItem.status} meta={RETURN_META} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {returnItem.customerId?.name} · {returnItem.customerId?.phone || returnItem.customerId?.email} · Qty {returnItem.quantity} ·{' '}
                      {new Date(returnItem.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="mt-1.5 text-xs">
                      <span className="font-medium text-foreground">Reason:</span> <span className="text-muted-foreground">{returnItem.reason}</span>
                    </p>
                    {returnItem.description && <p className="mt-0.5 text-xs text-muted-foreground">“{returnItem.description}”</p>}
                    {returnItem.adminNote && (
                      <p className="mt-0.5 text-xs"><span className="font-medium text-foreground">Your note:</span> <span className="text-muted-foreground">{returnItem.adminNote}</span></p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-sm font-bold">{formatPrice(returnItem.refundAmount)}</p>
                    <div className="flex gap-2">
                      {returnItem.status === 'requested' && (
                        <>
                          <Button size="sm" variant="success" disabled={busy} onClick={() => update(returnItem, 'approved')}>
                            <CheckCircle2 /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-danger-50" disabled={busy} onClick={() => { setNote(''); setRejectTarget(returnItem) }}>
                            <XCircle /> Reject
                          </Button>
                        </>
                      )}
                      {returnItem.status === 'approved' && (
                        <Button size="sm" disabled={busy} onClick={() => update(returnItem, 'completed')}>
                          <RotateCcw /> Mark refunded
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><RotateCcw className="size-6" /></span>
          <h2 className="text-base font-semibold">No return requests</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Customer return requests for delivered orders will appear here.</p>
        </div>
      )}

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject return request"
        description="The customer will see your note on the return status page."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={busy} onClick={() => update(rejectTarget, 'rejected', note.trim())}>
              <XCircle /> Reject return
            </Button>
          </>
        }
      >
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Optional: tell the customer why (e.g. item used, packaging missing)…" autoFocus />
      </Modal>
    </div>
  )
}