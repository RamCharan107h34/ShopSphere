import { cn } from '../../lib/utils.js'
import { typography } from '../../design/context.js'

export function SectionHeader({ title, subtitle, action, eyebrow, className }) {
  return (
    <div className={cn('mb-7 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className={typography.eyebrow}>{eyebrow}</p>}
        <h2 className={cn('sm:text-2xl', eyebrow && 'mt-1.5', typography.h2)}>{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export default SectionHeader
