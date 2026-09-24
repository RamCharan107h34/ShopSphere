import { Check, MapPin, PackageCheck, Truck } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { deliveryFlowSteps } from '../../lib/status.js'
import { useAccent } from '../../design/context.js'

const STEP_ICONS = [MapPin, PackageCheck, Truck, Check]

// Simple horizontal shipment timeline: Assigned → Shipped (picked up from seller) → Out for delivery → Delivered.
// step.state is one of 'done' | 'current' | 'idle' (from deliveryFlowSteps).
export function ShipmentTimeline({ status, className }) {
  const accent = useAccent()
  const steps = deliveryFlowSteps(status)
  if (!steps.length) return null

  return (
    <ol className={cn('flex items-start', className)}>
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[index] || Check
        const isLast = index === steps.length - 1
        return (
          <li key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
            {/* Connector line behind the dots */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-3.5 left-1/2 h-0.5 w-full',
                  step.state === 'done' ? accent.classes.fill : 'bg-slate-200',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors',
                step.state === 'done' && cn('text-white', accent.classes.fill, accent.classes.border),
                step.state === 'current' && cn('bg-white', accent.classes.border, accent.classes.text),
                step.state === 'idle' && 'border-slate-200 text-slate-400',
              )}
            >
              {step.state === 'done' ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
            </span>
            <span
              className={cn(
                'mt-1.5 text-[11px] leading-tight font-medium sm:text-xs',
                step.state === 'idle' ? 'text-slate-500' : 'text-slate-900',
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
