import { useState } from 'react'
import { CheckCircle2, EyeOff, Package, TimerReset } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { Thumb } from '../../components/seller/Thumb.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchAllProducts, moderateProduct } from '../../services/admin.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { formatPrice } from '../../lib/format.js'
import { cn } from '../../lib/utils.js'

const STATUS_META = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
  pending_moderation: { label: 'Pending review', variant: 'warning' },
}

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending_moderation', label: 'Pending review' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

export default function AdminProducts() {
  const { toast } = useToast()
  const [tab, setTab] = useState('')
  const { data: products, loading, refetch } = useFetch(() => fetchAllProducts(tab), [tab])
  const [busyId, setBusyId] = useState(null)

  const moderate = async (product, status) => {
    setBusyId(product._id)
    try {
      await moderateProduct(product._id, status)
      toast({
        title: status === 'active' ? 'Product approved' : status === 'inactive' ? 'Product hidden' : 'Set for review',
        description: `"${product.title}" is now ${status}.`,
        variant: status === 'active' ? 'success' : 'info',
      })
      refetch()
    } catch (error) {
      toast({ title: 'Could not moderate product', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageIntro title="Product moderation" subtitle="Review listings, approve new products and hide rule-breakers." />

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
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : products?.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Seller / Store</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Stock</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => {
                const status = STATUS_META[product.status] || { label: product.status, variant: 'neutral' }
                return (
                  <tr key={product._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb src={product.images?.[0]} alt={product.title} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{product.title}</p>
                          <p className="truncate text-xs text-slate-500">{product.category?.name || 'Uncategorised'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <p className="text-xs font-medium">{product.sellerId?.name || '—'}</p>
                      <p className="truncate text-xs text-slate-500">{product.storeId?.storeName || '—'}</p>
                    </td>
                    <td className="px-5 py-3 font-medium">{formatPrice(product.price)}</td>
                    <td className="hidden px-5 py-3 lg:table-cell">
                      {product.stock === 0 ? <Badge variant="danger">Out of stock</Badge> : <span className="text-slate-500">{product.stock} left</span>}
                    </td>
                    <td className="px-5 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        {product.status !== 'active' && (
                          <Button variant="outline" size="sm" loading={busyId === product._id} onClick={() => moderate(product, 'active')}>
                            <CheckCircle2 /> Approve
                          </Button>
                        )}
                        {product.status === 'active' && (
                          <Button variant="outline" size="sm" loading={busyId === product._id} onClick={() => moderate(product, 'inactive')}>
                            <EyeOff /> Hide
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-slate-500" loading={busyId === product._id} onClick={() => moderate(product, 'pending_moderation')}>
                          <TimerReset /> Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Package className="size-6" /></span>
          <h2 className="text-base font-semibold">No products here</h2>
          <p className="max-w-sm text-sm text-slate-500">Seller listings will appear here for moderation.</p>
        </div>
      )}
    </div>
  )
}