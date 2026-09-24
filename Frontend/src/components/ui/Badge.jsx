import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils.js'
import { useAccent } from '../../design/context.js'

export const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset transition-colors [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-violet-50 text-violet-700 ring-violet-200',
        secondary: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
        accent: 'bg-teal-50 text-teal-700 ring-teal-200',
        teal: 'bg-teal-50 text-teal-700 ring-teal-200',
        coral: 'bg-coral/10 text-[#b93232] ring-coral/30',
        outline: 'bg-white text-slate-700 ring-slate-200',
        success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        warning: 'bg-amber-50 text-amber-700 ring-amber-200',
        danger: 'bg-red-50 text-red-700 ring-red-200',
        neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function Badge({ className, variant, ...props }) {
  const accent = useAccent()
  const isDefault = !variant || variant === 'default'

  return (
    <span
      className={cn(
        badgeVariants({ variant }),
        isDefault && `${accent.classes.soft} ${accent.classes.chipRing}`,
        className,
      )}
      {...props}
    />
  )
}
