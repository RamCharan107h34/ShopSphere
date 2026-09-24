import { cn } from '../../lib/utils.js'

// Magic UI-style button with an infinitely sweeping gradient sheen
export function ShimmerButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        'group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-lg px-6 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]',
        // Sheen sweeps across on hover (no keyframes needed)
        'bg-[linear-gradient(110deg,#4c1d95,45%,#a78bfa,55%,#4c1d95)] bg-[length:200%_100%] bg-[position:0%_0%] transition-[background-position,transform] duration-[1200ms] hover:bg-[position:100%_0%]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
