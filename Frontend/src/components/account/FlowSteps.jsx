import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { cn } from '../../lib/utils.js'

// Vertical status stepper.
// steps: [{ key, label, state: 'done'|'current'|'idle', hint? }]
// A `current` step with `danger: true` renders as a rejected/X node.
export function FlowSteps({ steps, className }) {
  return (
    <ol className={cn('space-y-0', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const done = step.state === 'done'
        const current = step.state === 'current'
        const danger = Boolean(step.danger)
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Connector line to the next node */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 rounded-full',
                  done ? 'bg-success/50' : 'bg-border',
                )}
              />
            )}

            {/* Node */}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.04 }}
              className={cn(
                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border',
                done && 'border-success bg-success text-white',
                current && !danger && 'border-primary bg-primary/10 text-primary',
                current && danger && 'border-danger-300 bg-danger-50 text-danger-600',
                !done && !current && 'border-border bg-card text-muted-foreground/40',
              )}
            >
              {done ? (
                <Check className="size-3.5" />
              ) : danger ? (
                <X className="size-3.5" />
              ) : current ? (
                <span className="size-2 rounded-full bg-current" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </motion.span>

            {/* Label */}
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-sm leading-tight',
                  done && 'font-medium text-foreground',
                  current && 'font-semibold text-primary',
                  !done && !current && 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              {step.hint && <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
