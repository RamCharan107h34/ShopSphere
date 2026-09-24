import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgePercent, Check, TicketPercent, X } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { useToast } from '../ui/toast.jsx'
import { validateCoupon } from '../../services/shop.js'
import { getErrorMessage } from '../../services/api.js'
import { formatPrice } from '../../lib/format.js'

// Coupon input that validates against the current order amount.
//
//   applied  -> null | { code, discount, discountType, discountValue, finalAmount }
//   onApply  -> called with the validated coupon, or null when removed
//   autoCode -> optional code to validate automatically once subtotal is known
//               (used when arriving from another page with a code in hand)
export function CouponBox({ subtotal, applied, onApply, autoCode }) {
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const autoTried = useRef(false)

  const runApply = async (rawCode, { silent = false } = {}) => {
    const trimmed = (rawCode || '').trim().toUpperCase()
    if (!trimmed) return
    setBusy(true)
    try {
      const coupon = await validateCoupon(trimmed, subtotal)
      onApply(coupon)
      setCode('')
      if (!silent) {
        toast({
          title: 'Coupon applied 🎉',
          description: `${coupon.code} saved you ${formatPrice(coupon.discount)}`,
          variant: 'success',
        })
      }
    } catch (error) {
      toast({ title: 'Could not apply coupon', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  // Auto-apply a carried-over code exactly once, once the order amount is known
  useEffect(() => {
    if (autoTried.current || !autoCode || subtotal <= 0 || applied) return
    autoTried.current = true
    runApply(autoCode, { silent: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCode, subtotal])

  // Applied state: show a removable chip with the saving
  if (applied) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Check className="size-4 text-emerald-700" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <TicketPercent className="size-3.5 text-emerald-700" />
              {applied.code}
            </p>
            <p className="text-xs text-slate-500">
              You're saving {formatPrice(applied.discount)}
            </p>
          </div>
        </div>
        <button
          onClick={() => onApply(null)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-emerald-100 hover:text-slate-900"
          aria-label={`Remove coupon ${applied.code}`}
        >
          <X className="size-3.5" /> Remove
        </button>
      </motion.div>
    )
  }

  // NOTE: intentionally not a <form> — Cart/Checkout embed this inside their own
  // order <form>, and nested forms are invalid HTML.
  return (
    <div role="group" aria-label="Apply coupon" className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <BadgePercent className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              runApply(code)
            }
          }}
          placeholder="Coupon code"
          aria-label="Coupon code"
          className="pl-9 uppercase"
          maxLength={30}
        />
      </div>
      <Button type="button" variant="outline" loading={busy} disabled={!code.trim() || subtotal <= 0} onClick={() => runApply(code)}>
        Apply
      </Button>
    </div>
  )
}
