import { cn } from '../../lib/utils.js'
import { layout, toneIcon, tones, useAccent } from '../../design/context.js'

/** Page title + optional action row. Used at the top of every dashboard page. */
export function PageIntro({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className={layout.pageTitle}>{title}</h1>
        {subtitle && <p className={layout.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * KPI tile. `tone="primary"` follows the workspace accent (gradient icon chip);
 * the rest are fixed semantic tones so meaning never shifts between roles.
 */
export function StatCard({ icon: Icon, label, value, hint, tone = 'primary' }) {
  const accent = useAccent()
  const isPrimary = tone === 'primary'

  return (
    <div className={layout.stat}>
      <div className="flex items-start justify-between gap-3">
        <p className={layout.statLabel}>{label}</p>
        {Icon && (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
              isPrimary
                ? cn(accent.classes.iconChip, 'ring-white/20')
                : toneIcon[tone] || tones.neutral,
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className={layout.statValue}>{value}</p>
      {hint && <p className={layout.statHint}>{hint}</p>}
    </div>
  )
}
