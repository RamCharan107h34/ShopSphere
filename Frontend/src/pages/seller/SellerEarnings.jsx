import { useEffect, useState } from 'react'
import { Banknote, Clock, Percent, TrendingUp, Wallet } from 'lucide-react'
import { PageIntro, StatCard } from '../../components/seller/PageIntro.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import {
  fetchSellerSettlementSummary,
  fetchSellerSettlements,
} from '../../services/settlements.js'
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
  { key: 'pending', label: 'In hold' },
  { key: 'eligible', label: 'Eligible' },
  { key: 'paid', label: 'Paid' },
]

export default function SellerEarnings() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data: summary, loading: summaryLoading } = useFetch(fetchSellerSettlementSummary)
  const { data: ledger, loading } = useFetch(
    () => fetchSellerSettlements({ page, status }),
    [page, status],
  )

  useEffect(() => {
    setPage(1)
  }, [status])

  const totals = summary?.totals || {}
  const weekly = summary?.weekly || []
  const settlements = ledger?.settlements || []
  const totalPages = ledger?.totalPages || 1
  const commissionRate = summary?.store?.commissionRate

  return (
    <div>
      <PageIntro
        title="Earnings & payouts"
        subtitle="Each delivered vendor order creates a settlement row. The platform keeps its commission and pays you the rest once the hold window clears."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Gross sales"
          value={formatPrice(totals.grossAmount)}
          hint={`${totals.count || 0} settled order${totals.count === 1 ? '' : 's'}`}
        />
        <StatCard
          icon={Percent}
          label="Platform commission"
          value={formatPrice(totals.commissionAmount)}
          hint={commissionRate !== undefined && commissionRate !== null ? `${commissionRate}% of gross` : 'Set by the platform'}
          tone="warning"
        />
        <StatCard
          icon={Wallet}
          label="Net earned"
          value={formatPrice(totals.netPayable)}
          hint={`${formatPrice(totals.paid)} already paid out`}
          tone="success"
        />
        <StatCard
          icon={Clock}
          label="Awaiting payout"
          value={formatPrice((totals.pending || 0) + (totals.eligible || 0))}
          hint={`${formatPrice(totals.eligible)} eligible now`}
          tone="info"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
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
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : settlements.length ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Commission</th>
                    <th className="px-4 py-3 text-right">Net</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((row) => {
                    const meta = STATUS_META[row.status] || STATUS_META.pending
                    return (
                      <tr key={row._id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.orderNumber || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(row.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatPrice(row.grossAmount)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                          −{formatPrice(row.commissionAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-teal">
                          {formatPrice(row.netPayable)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          {row.payoutReference && (
                            <p className="mt-1 text-[11px] text-slate-400">Ref {row.payoutReference}</p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Banknote className="size-6" />
              </span>
              <h2 className="text-base font-semibold">No settlements yet</h2>
              <p className="max-w-sm text-sm text-slate-500">
                A settlement is created the moment one of your orders is marked delivered.
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Weekly payout report */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Weekly payout report</h2>
          <p className="mt-1 text-xs text-slate-500">Net payable per week, most recent first.</p>

          {summaryLoading ? (
            <div className="mt-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : weekly.length ? (
            <ul className="mt-4 space-y-2">
              {weekly.map((week) => (
                <li key={week.period} className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">{week.period}</span>
                    <span className="text-sm font-bold tabular-nums text-teal">{formatPrice(week.net)}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {week.count} order{week.count === 1 ? '' : 's'} · gross {formatPrice(week.gross)} · commission{' '}
                    {formatPrice(week.commission)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-500">No settled weeks yet.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
