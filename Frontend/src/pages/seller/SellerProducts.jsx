import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, Pencil, Trash2 } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { Thumb } from '../../components/seller/Thumb.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchMyProducts, deleteProduct } from '../../services/seller.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { formatPrice } from '../../lib/format.js'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

const STATUS_META = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
  pending_moderation: { label: 'Pending review', variant: 'warning' },
}

function stockLabel(product) {
  if (product.stock === 0) return <Badge variant="danger">Out of stock</Badge>
  if (product.stock <= product.lowStockThreshold) return <Badge variant="warning">Low: {product.stock}</Badge>
  return <span className="text-sm font-medium text-muted-foreground">{product.stock} in stock</span>
}

export default function SellerProducts() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: products, loading, refetch } = useFetch(fetchMyProducts)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProduct(deleteTarget._id)
      toast({ title: 'Product deleted', description: `"${deleteTarget.title}" was removed.`, variant: 'success' })
      setDeleteTarget(null)
      refetch()
    } catch (error) {
      toast({ title: 'Could not delete product', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageIntro
        title="Products"
        subtitle={`${products?.length ?? 0} product${products?.length === 1 ? '' : 's'} listed in your store.`}
        actions={
          <Button onClick={() => navigate('/seller/products/new')}>
            <PackagePlus /> Add product
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : products?.length ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <ul className="divide-y divide-border">
            {products.map((product) => {
              const status = STATUS_META[product.status] || { label: product.status, variant: 'neutral' }
              return (
                <li key={product._id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <Thumb src={product.images?.[0]} alt={product.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{product.category?.name || 'Uncategorised'}</span>
                      <span className="text-border">•</span>
                      <span>{formatPrice(product.price)}</span>
                      {product.variants?.length > 0 && (
                        <>
                          <span className="text-border">•</span>
                          <span>{product.variants.length} variant{product.variants.length > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stockLabel(product)}
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/seller/products/${product._id}/edit`)}>
                      <Pencil /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(product)} aria-label={`Delete ${product.title}`}>
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PackagePlus className="size-6" /></span>
          <h2 className="text-base font-semibold">No products yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Add your first product and it will appear in the ShopSphere catalog once your store is approved.</p>
          <Button className="mt-2" onClick={() => navigate('/seller/products/new')}><PackagePlus /> Add your first product</Button>
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete product?"
        description={`"${deleteTarget?.title}" will be removed from your store and the ShopSphere catalog. This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}><Trash2 /> Delete</Button>
          </>
        }
      />
    </div>
  )
}