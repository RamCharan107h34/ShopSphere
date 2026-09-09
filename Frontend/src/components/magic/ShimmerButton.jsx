import { cn } from '../../lib/utils.js'

// Magic UI-style button with an infinitely sweeping gradient sheen
export function ShimmerButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        'group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-lg px-6 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]',
        'bg-[linear-gradient(110deg,#5b21b6,45%,#a78bfa,55%,#5b21b6)] bg-[length:200%_100%] animate-shimmer',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
