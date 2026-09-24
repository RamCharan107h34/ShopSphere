import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { useAccent } from '../../design/context.js'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // `default` resolves to the surrounding workspace accent at runtime
        default: 'text-white shadow-sm hover:shadow-lg',
        outline:
          'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        accent: 'bg-teal-700 text-white shadow-sm hover:bg-teal-800 hover:shadow-lg',
        coral: 'bg-coral text-white shadow-sm hover:bg-coral-strong hover:shadow-lg',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-lg',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-lg',
      },
      size: {
        sm: 'h-9 px-3.5 text-[13px]',
        default: 'h-10 px-4',
        lg: 'h-12 rounded-xl px-6 text-[15px]',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export function Button({ className, variant, size, loading, disabled, children, ...props }) {
  const accent = useAccent()
  const isPrimary = !variant || variant === 'default'

  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        // Inside a role workspace the primary button adopts that role's accent
        isPrimary && `${accent.classes.gradient} ${accent.classes.glow}`,
        accent.classes.focus,
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  )
}
