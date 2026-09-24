import { useEffect, useState } from 'react'
import { BadgeCheck, Banknote, Clock, Percent, Wallet } from 'lucide-react'
import { PageIntro, StatCard } from '../../components/seller/PageIntro.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useToast } from '../../components/ui/toast.jsx'
import { fetchAdminSettlements, markSettlementPaid } from '../../services/settlements.js'
import { getErrorMessage } from '../../services/api.js'
import { formatPrice } from '../../lib/format.js'
import { cn } from '../../lib/utils.js'

const STATUS_META = {
  pending: { label: 'In hold window', variant: 'warning' },
  eligible: { label: 'Ready to pay out', variant: 'teal' },
  paid: { label: 'Paid', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'eligible', label: 'Eligible' },
  { key: 'pending', label: 'In hold' },
  { key: 'paid', label: 'Paid' },
]

export default function AdminSettlements() {
  const { toast } = useToast()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [payTarget, setPayTarget] = useState(null)
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)

  const { data, loading, refetch } = useFetch(
    () => fetchAdminSettlements({ page, status }),
    [page, status],
  )

  useEffect(() => {
    setPage(1)
  }, [status])

  const totals = data?.totals || {}
  const settlements = data?.settlements || []
  const totalPages = data?.totalPages || 1

  const payOut = async () => {
    if (!payTarget) return
    setBusy(true)
    try {
      const settlement = await markSettlementPaid(payTarget._id, reference.trim())
      toast({
        title: 'Payout recorded',
        description: `${formatPrice(settlement.netPayable)} paid to ${payTarget.sellerId?.name || 'seller'} (ref ${settlement.payoutReference}).`,
        variant: 'success',
      })
      setPayTarget(null)
      setReference('')
      refetch()
    } catch (error) {
      toast({ title: 'Could not record payout', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro
        title="Seller settlements"
        subtitle="One ledger row per delivered vendor order. Marking a row paid notifies the seller and writes to the audit trail."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Gross volume"
          value={formatPrice(totals.grossAmount)}
          hint={`${totals.count || 0} settled order${totals.count === 1 ? '' : 's'} (all filters)`}
        />
        <StatCard
          icon={Percent}
          label="Commission earned"
          value={formatPrice(totals.commissionAmount)}
          hint="Platform revenue from settlements"
          tone="warning"
        />
        <StatCard
          icon={Clock}
          label="Owed to sellers"
          value={formatPrice((totals.pending || 0) + (totals.eligible || 0))}
          hint={`${formatPrice(totals.eligible)} due now`}
          tone="danger"
        />
        <StatCard
          icon={Wallet}
          label="Already paid out"
          value={formatPrice(totals.paid)}
          hint="Lifetime payouts recorded"
          tone="success"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            onClick={() => setStatus(option.key)}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 transition',
              status === option.key
                ? 'bg-teal text-white ring-teal'
                : 'bg-white text-slate-600 ring-slate-200 hover:text-slate-900',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : settlements.length ? (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Seller / store</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-right">Net</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {settlements.map((row) => {
                const meta = STATUS_META[row.status] || STATUS_META.pending
                return (
                  <tr key={row._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.orderNumber || '—'}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(row.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.storeId?.storeName || '—'}</p>
                      <p className="text-[11px] text-slate-400">{row.sellerId?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPrice(row.grossAmount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">{row.commissionRate}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                      {formatPrice(row.commissionAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-teal">
                      {formatPrice(row.netPayable)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {row.status === 'paid' && row.paidAt && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {new Date(row.paidAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status !== 'paid' && row.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReference('')
                            setPayTarget(row)
                          }}
                        >
                          <BadgeCheck /> Mark paid
                        </Button>
                      )}
                      {row.payoutReference && (
                        <p className="mt-1 text-[11px] text-slate-400">{row.payoutReference}</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Banknote className="size-6" />
          </span>
          <h2 className="text-base font-semibold">No settlements in this view</h2>
          <p className="max-w-sm text-sm text-slate-500">
            Rows appear automatically when a vendor sub-order is marked delivered by a delivery partner.
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

      <Modal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title="Record a payout"
        description="Payout references are stored on the ledger row and recorded in the audit log."
        footer={
          <>
            <Button variant="outline" onClick={() => setPayTarget(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={payOut}>
              <BadgeCheck /> Mark paid
            </Button>
          </>
        }
      >
        {payTarget && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Seller</span>
                <span className="font-medium">{payTarget.sellerId?.name || '—'}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-slate-500">Order</span>
                <span className="font-medium">{payTarget.orderNumber || '—'}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-slate-500">Gross</span>
                <span className="tabular-nums">{formatPrice(payTarget.grossAmount)}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-slate-500">Commission ({payTarget.commissionRate}%)</span>
                <span className="tabular-nums">−{formatPrice(payTarget.commissionAmount)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <span>Net payout</span>
                <span className="tabular-nums text-teal">{formatPrice(payTarget.netPayable)}</span>
              </div>
            </div>

            <div>
              <label htmlFor="payout-reference" className="mb-1 block text-xs font-semibold text-slate-700">
                Payout reference (optional)
              </label>
              <Input
                id="payout-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="e.g. UTR / bank reference — auto-generated if left blank"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
