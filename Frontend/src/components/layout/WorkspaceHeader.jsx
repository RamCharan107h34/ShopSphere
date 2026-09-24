import { cn } from '../../lib/utils.js'
import { elevation, typography, useAccent } from '../../design/context.js'

/**
 * Role identity band that tops every dashboard.
 *
 * It names the workspace on the role's own gradient, carries the page title and
 * optional chips/actions, and gives each dashboard an unmistakable header —
 * whereas the surrounding shell stays identical across seller / admin /
 * support / delivery.
 */
export function WorkspaceHeader({ icon: Icon, role, title, hint, chips, actions }) {
  const accent = useAccent()

  return (
    <header
      className={cn(
        'relative mb-6 overflow-hidden rounded-3xl px-5 py-5 text-white sm:px-6 sm:py-6',
        accent.classes.band,
        elevation.lift,
      )}
    >
      {/* Corner glow, top-left sheen and a hairline base */}
      <div
        className={cn(
          'pointer-events-none absolute -top-24 -right-20 size-72 rounded-full blur-3xl',
          accent.classes.bandGlow,
        )}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-white/20" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className={typography.eyebrowOnDark}>{role}</p>
            <p className="font-display truncate text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">
              {title}
            </p>
            {hint && <p className="mt-0.5 truncate text-xs text-white/70">{hint}</p>}
          </div>
        </div>

        {(chips || actions) && (
          <div className="flex flex-wrap items-center gap-2">
            {chips}
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

/** Small translucent chip for use inside a workspace band. */
export function BandChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  )
}

export default WorkspaceHeader
