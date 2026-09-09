import { useState } from 'react'
import { Boxes, Check, Pencil, TriangleAlert } from 'lucide-react'
import { PageIntro } from '../../components/seller/PageIntro.jsx'
import { Thumb } from '../../components/seller/Thumb.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { fetchMyProducts, updateStock } from '../../services/seller.js'
import { useToast } from '../../components/ui/toast.jsx'
import { getErrorMessage } from '../../services/api.js'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { cn } from '../../lib/utils.js'

function StockCell({ value, onChange, invalid }) {
  return (
    <Input
      type="number"
      min="0"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={invalid}
      className={cn('h-9 w-24 text-center', invalid && 'border-destructive')}
    />
  )
}

function ProductRow({ product, onSaved }) {
  const { toast } = useToast()
  const [stock, setStock] = useState(String(product.stock))
  const [threshold, setThreshold] = useState(String(product.lowStockThreshold))
  const [saving, setSaving] = useState(false)

  const parsedStock = Number(stock)
  const parsedThreshold = Number(threshold)
  const invalid = stock !== '' && (!Number.isInteger(parsedStock) || parsedStock < 0)
  const invalidThreshold = threshold !== '' && (!Number.isInteger(parsedThreshold) || parsedThreshold < 0)
  const dirty = Number(stock) !== product.stock || Number(threshold) !== product.lowStockThreshold

  const save = async () => {
    if (invalid || invalidThreshold) return
    setSaving(true)
    try {
      await updateStock(product._id, { stock: parsedStock, lowStockThreshold: parsedThreshold })
      toast({ title: 'Inventory updated', description: `"${product.title}" now has ${parsedStock} in stock.`, variant: 'success' })
      onSaved?.()
    } catch (error) {
      toast({ title: 'Could not update inventory', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const low = product.stock > 0 && product.stock <= product.lowStockThreshold

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <Thumb src={product.images?.[0]} alt={product.title} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{product.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {product.stock === 0 ? (
              <Badge variant="danger">Out of stock</Badge>
            ) : low ? (
              <>
                <TriangleAlert className="size-3 text-warning-700" />
                <span className="text-warning-700">Low stock</span>
              </>
            ) : (
              <Badge variant="success">In stock</Badge>
            )}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Stock</label>
            <StockCell value={stock} onChange={setStock} invalid={invalid} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Low at</label>
            <StockCell value={threshold} onChange={setThreshold} invalid={invalidThreshold} />
          </div>
          <Button variant="outline" size="sm" className="mb-0.5" disabled={!dirty || invalid || invalidThreshold} loading={saving} onClick={save}>
            {dirty ? <><Check /> Save</> : <><Pencil className="opacity-50" /> Current</>}
          </Button>
        </div>
      </div>

      {/* Variant stock rows */}
      {product.variants?.length > 0 && (
        <div className="space-y-1 bg-muted/30 px-5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Variant stock</p>
          {product.variants.map((variant) => (
            <VariantRow key={variant._id} productId={product._id} variant={variant} />
          ))}
        </div>
      )}
    </div>
  )
}

function VariantRow({ productId, variant }) {
  const { toast } = useToast()
  const [stock, setStock] = useState(String(variant.stock))
  const [saving, setSaving] = useState(false)

  const parsed = Number(stock)
  const invalid = stock !== '' && (!Number.isInteger(parsed) || parsed < 0)
  const dirty = Number(stock) !== variant.stock

  const save = async () => {
    if (invalid) return
    setSaving(true)
    try {
      await updateStock(productId, { stock: parsed, variantId: variant._id })
      toast({ title: 'Variant stock updated', description: `"${variant.name}" now has ${parsed} in stock.`, variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not update variant', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm">{variant.name}</span>
      {variant.sku && <span className="text-xs text-muted-foreground">{variant.sku}</span>}
      <StockCell value={stock} onChange={setStock} invalid={invalid} />
      <Button variant="outline" size="sm" disabled={!dirty || invalid} loading={saving} onClick={save}>
        <Check /> Save
      </Button>
    </div>
  )
}

export default function SellerInventory() {
  const { data: products, loading, refetch } = useFetch(fetchMyProducts)

  const counts = {
    out: products?.filter((p) => p.stock === 0).length ?? 0,
    low: products?.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length ?? 0,
    healthy: products?.filter((p) => p.stock > p.lowStockThreshold).length ?? 0,
  }

  return (
    <div>
      <PageIntro title="Inventory" subtitle="Update stock levels and low-stock thresholds in place." />

      {!loading && products && (
        <div className="mb-5 flex flex-wrap gap-2">
          <Badge variant="success">{counts.healthy} healthy</Badge>
          <Badge variant="warning">{counts.low} low</Badge>
          <Badge variant="danger">{counts.out} out of stock</Badge>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : products?.length ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {products.map((product) => (
            <ProductRow key={product._id} product={product} onSaved={refetch} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Boxes className="size-6" /></span>
          <h2 className="text-base font-semibold">Nothing to track yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Products you list will appear here with live stock controls.</p>
        </div>
      )}
    </div>
  )
}