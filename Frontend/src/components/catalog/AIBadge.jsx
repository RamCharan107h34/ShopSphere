import { Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils.js'

// Small shimmering chip that marks AI-assisted UI.
// Used on the search indicator and the "Best match" sort option.
export function AIBadge({ children = 'AI-powered', className, animate = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700',
        className,
      )}
    >
      <Sparkles className={cn('size-3 text-violet-500', animate && 'animate-pulse')} />
      {children}
    </span>
  )
}
