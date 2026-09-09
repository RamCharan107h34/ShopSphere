import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Info, PackageOpen, RotateCcw, Store } from 'lucide-react'
import { formatPrice } from '../../lib/format.js'
import { isPlaceholderImage } from '../../lib/utils.js'
import { RETURN_META, returnFlowSteps } from '../../lib/status.js'
import { useToast } from '../../components/ui/toast.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { FlowSteps } from '../../components/account/FlowSteps.jsx'
import { StatusBadge } from '../../components/account/StatusBadge.jsx'
import { fetchMyReturns } from '../../services/account.js'
import { getErrorMessage } from '../../services/api.js'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Returns() {
  const { toast } = useToast()
  const [returns, setReturns] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setReturns(await fetchMyReturns())
    } catch (err) {
      setError(err)
      toast({ title: 'Could not load returns', description: getErrorMessage(err), variant: 'error' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const statusCounts = useMemo(() => {
    const counts = {}
    for (const item of returns || []) {
      counts[item.status] = (counts[item.status] || 0) + 1
    }
    return counts
  }, [returns])

  if (error && !returns) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="font-semibold">Couldn't load your returns</p>
        <Button variant="outline" onClick={load}>Try again</Button>
      </div>
    )
  }

  if (!returns) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Returns</h2>
        <p className="text-sm text-muted-foreground">
          {returns.length === 0 ? 'No return requests yet' : `${returns.length} ${returns.length === 1 ? 'request' : 'requests'}`}
        </p>
      </div>

      {/* Status summary chips */}
      {returns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge key={status} variant={RETURN_META[status]?.variant} className="px-3 py-1">
              {RETURN_META[status]?.label || status}: {count}
            </Badge>
          ))}
        </div>
      )}

      {returns.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted">
            <RotateCcw className="size-8 text-muted-foreground" />
          </span>
          <h3 className="text-lg font-semibold">No return requests</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Delivered items can be returned within the return window. Find the order and tap "Return" on an item.
          </p>
          <Link to="/account/orders">
            <Button size="lg">
              View my orders <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        returns.map((item, index) => {
          const product = item.productId || {}
          const store = item.storeId || {}
          const steps = returnFlowSteps(item.status)
          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-warning/15">
                      <RotateCcw className="size-4 text-warning-700" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Return request</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3" /> {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} meta={RETURN_META} />
                </div>

                <div className="grid gap-6 p-5 md:grid-cols-[1fr_230px]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      {!isPlaceholderImage(product.images?.[0]) ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                          className="size-14 rounded-lg object-cover ring-1 ring-border"
                        />
                      ) : (
                        <span className="flex size-14 items-center justify-center rounded-lg bg-muted">
                          <PackageOpen className="size-5 text-muted-foreground/60" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          to={`/product/${product._id}`}
                          className="line-clamp-1 text-sm font-semibold hover:text-primary"
                        >
                          {product.title || 'Product'}
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Store className="size-3" /> {store.storeName || 'ShopSphere seller'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Qty {item.quantity}</Badge>
                      <Badge variant="secondary">Reason: {item.reason}</Badge>
                      <Badge variant="default">
                        Refund {formatPrice(item.refundAmount)}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="mt-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground">
                        “{item.description}”
                      </p>
                    )}

                    {item.adminNote && (
                      <p className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-muted-foreground">
                        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                        Seller note: {item.adminNote}
                      </p>
                    )}

                    <div className="mt-4">
                      <Link
                        to={`/account/orders/${item.orderId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View related order <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Status flow */}
                  <div className="rounded-xl border border-border bg-card/60 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.status === 'rejected' ? 'Decision' : 'Return progress'}
                    </p>
                    {steps.length > 0 ? (
                      <FlowSteps steps={steps} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Status: {item.status}</p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })
      )}
    </div>
  )
}
