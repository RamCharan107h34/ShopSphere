import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-primary/10 text-primary',
        secondary: 'border border-transparent bg-secondary text-secondary-foreground',
        outline: 'border border-border text-foreground',
        success: 'border border-transparent bg-success/10 text-success-700',
        warning: 'border border-transparent bg-warning/15 text-warning-700',
        danger: 'border border-transparent bg-danger-50 text-danger-600',
        neutral: 'border border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
