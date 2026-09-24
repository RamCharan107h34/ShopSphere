import { cn } from '../../lib/utils.js'

// Shimmering placeholder used while content loads
export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200', className)} aria-hidden="true" />
}
