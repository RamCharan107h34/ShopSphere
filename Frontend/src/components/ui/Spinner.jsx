import { cn } from '../../lib/utils.js'

// Generic animated loading spinner
export function Spinner({ className }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
