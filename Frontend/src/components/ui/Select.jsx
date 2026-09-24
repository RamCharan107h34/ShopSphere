import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { layout, useAccent } from '../../design/context.js'

export function Select({ className, children, ...props }) {
  const accent = useAccent()
  return (
    <div className="relative">
      <select
        className={cn(
          layout.field,
          'h-10 cursor-pointer appearance-none pr-9',
          accent.classes.focusRing,
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export default Select
