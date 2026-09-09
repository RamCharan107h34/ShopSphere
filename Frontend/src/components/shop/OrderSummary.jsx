import { ShoppingBag } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { formatPrice } from '../../lib/format.js'
import { Card } from '../ui/Card.jsx'

// Shared price breakdown used on the Cart and Checkout pages.
//   itemLabel  -> e.g. "3 items" (shown next to Subtotal)
//   discount   -> coupon saving (0 when none applied)
//   children   -> action buttons rendered below the total
//   extraRows  -> optional [{ label, value, hint }] rows before the total
export function OrderSummary({ itemLabel, subtotal, discount = 0, children, className, extraRows = [] }) {
  const total = Math.max(0, subtotal - discount)

  return (
    <Card className={cn('sticky top-24', className)}>
      <div className="border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShoppingBag className="size-4 text-primary" />
          Order summary
        </h2>
      </div>

      <div className="space-y-2.5 px-5 py-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal ({itemLabel})</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Delivery</span>
          <span className="font-medium text-success-700">Free</span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-success-700">
            <span>Coupon discount</span>
            <span className="font-medium">−{formatPrice(discount)}</span>
          </div>
        )}

        {extraRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-dashed border-border pt-3 text-base">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold tracking-tight">{formatPrice(total)}</span>
        </div>
      </div>

      {children && <div className="space-y-2 border-t border-border px-5 py-4">{children}</div>}
    </Card>
  )
}
