import { useState } from 'react'
import { CheckCircle2, Store, XCircle } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchApplications, moderateStore } from '../../services/admin.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Textarea } from '../../components/ui/Textarea.jsx'
import { cn } from '../../lib/utils.js'

const STORE_STATUS = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'danger' },
}

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function AdminSellers() {
  const { toast } = useToast()
  const [tab, setTab] = useState('pending')
  const { data: applications, loading, refetch } = useFetch(() => fetchApplications(tab), [tab])
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [commission, setCommission] = useState('10')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const approve = async () => {
    setBusy(true)
    try {
      await moderateStore(approveTarget._id, { status: 'approved', commissionRate: Number(commission) || 10 })
      toast({ title: 'Application approved', description: `${approveTarget.storeName} can now list products.`, variant: 'success' })
      setApproveTarget(null)
      refetch()
    } catch (error) {
      toast({ title: 'Could not approve', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    setBusy(true)
    try {
      await moderateStore(rejectTarget._id, { status: 'rejected', rejectionReason: reason.trim() || 'Application did not meet platform requirements.' })
      toast({ title: 'Application rejected', description: `${rejectTarget.storeName} was rejected.`, variant: 'error' })
      setRejectTarget(null)
      setReason('')
      refetch()
    } catch (error) {
      toast({ title: 'Could not reject', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title="Seller management" subtitle="Review store applications and manage seller onboarding." />

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              tab === item.key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : applications?.length ? (
        <div className="space-y-3">
          {applications.map((store) => {
            const status = STORE_STATUS[store.status] || { label: store.status, variant: 'neutral' }
            return (
              <div key={store._id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Store className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{store.storeName}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {store.sellerId?.name} · {store.sellerId?.email} · Applied{' '}
                    {new Date(store.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {store.description && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{store.description}</p>}
                  {store.status === 'rejected' && store.rejectionReason && (
                    <p className="mt-1 text-xs text-red-600">Reason: {store.rejectionReason}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="mr-2 text-xs text-slate-500">Commission {store.commissionRate}%</span>
                  {store.status === 'pending' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => { setCommission(String(store.commissionRate ?? 10)); setApproveTarget(store) }}>
                        <CheckCircle2 /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => { setReason(''); setRejectTarget(store) }}>
                        <XCircle /> Reject
                      </Button>
                    </>
                  )}
                  {store.status === 'rejected' && (
                    <Button size="sm" variant="outline" onClick={() => { setCommission(String(store.commissionRate ?? 10)); setApproveTarget(store) }}>
                      Reconsider
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Store className="size-6" /></span>
          <h2 className="text-base font-semibold">No applications here</h2>
          <p className="max-w-sm text-sm text-slate-500">Seller store applications will appear here for review.</p>
        </div>
      )}

      {/* Approve modal */}
      <Modal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Approve seller application"
        description={`Approve "${approveTarget?.storeName}" to start selling on ShopSphere.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
            <Button variant="success" loading={busy} onClick={approve}><CheckCircle2 /> Approve store</Button>
          </>
        }
      >
        <label className="mb-1.5 block text-sm font-medium">Platform commission rate (%)</label>
        <Input type="number" min="0" max="100" value={commission} onChange={(event) => setCommission(event.target.value)} />
        <p className="mt-1.5 text-xs text-slate-500">A percentage of every delivered order this store earns, taken as the platform fee.</p>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject seller application"
        description={`Reject "${rejectTarget?.storeName}"? The seller will see your reason on their dashboard.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={busy} onClick={reject}><XCircle /> Reject application</Button>
          </>
        }
      >
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Optional: why was this application rejected?…" autoFocus />
      </Modal>
    </div>
  )
}