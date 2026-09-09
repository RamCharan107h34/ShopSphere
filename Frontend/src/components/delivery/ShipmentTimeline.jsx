import { Check, MapPin, PackageCheck, Truck } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { deliveryFlowSteps } from '../../lib/status.js'

const STEP_ICONS = [MapPin, PackageCheck, Truck, Check]

// Simple horizontal shipment timeline: Assigned → Picked up → In transit → Delivered.
// step.state is one of 'done' | 'current' | 'idle' (from deliveryFlowSteps).
export function ShipmentTimeline({ status, className }) {
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
                  step.state === 'done' ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-card transition-colors',
                step.state === 'done' && 'border-primary bg-primary text-primary-foreground',
                step.state === 'current' && 'border-primary text-primary',
                step.state === 'idle' && 'border-border text-muted-foreground',
              )}
            >
              {step.state === 'done' ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
            </span>
            <span
              className={cn(
                'mt-1.5 text-[11px] font-medium leading-tight sm:text-xs',
                step.state === 'idle' ? 'text-muted-foreground' : 'text-foreground',
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
