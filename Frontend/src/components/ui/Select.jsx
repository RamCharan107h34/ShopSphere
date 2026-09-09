import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils.js'

// Styled native <select> (keeps forms simple, no headless-ui dependency)
export function Select({ className, children, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
