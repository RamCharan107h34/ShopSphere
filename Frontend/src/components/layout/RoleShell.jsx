import { LogOut } from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { AccentProvider, layout, typography, useAccent } from '../../design/context.js'
import { RoleNav } from './RoleNav.jsx'
import { WorkspaceHeader } from './WorkspaceHeader.jsx'

/**
 * The dashboard shell shared by all four staff workspaces.
 *
 * Seller, admin, support and delivery dashboards are the same product with
 * different contents, so they all render through this component: the sidebar,
 * mobile nav, header band and sign-out block are defined once and each role
 * supplies its own nav items, identity and header copy. The surrounding
 * <AccentProvider> is what re-tints the whole tree.
 */
export function RoleShell({
  role,
  icon: Icon,
  navLabel,
  navItems,
  identity,
  workspace,
  title,
  hint,
  chips,
  actions,
  banner,
  onSignOut,
  children,
}) {
  return (
    <AccentProvider role={role}>
      <div className={layout.shell}>
        <div className={layout.grid}>
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <nav className={layout.sidebar} aria-label={navLabel}>
              {identity}

              <RoleNav items={navItems} />

              <div className="mt-1 border-t border-slate-100 pt-1.5">
                <button onClick={onSignOut} className={layout.navSignOut}>
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            <WorkspaceHeader
              icon={Icon}
              role={workspace}
              title={title}
              hint={hint}
              chips={chips}
              actions={actions}
            />

            {/* Mobile nav */}
            <nav className={layout.mobileNav} aria-label={navLabel}>
              <div className="flex min-w-max gap-1.5">
                <RoleNav items={navItems} pill />
              </div>
            </nav>

            {banner}

            {children}
          </div>
        </div>
      </div>
    </AccentProvider>
  )
}

/** Who this workspace belongs to — avatar or icon, name and a role badge. */
export function IdentityBlock({ name, subtitle, badge, initials, icon: Icon }) {
  const accent = useAccent()

  return (
    <div className={layout.sidebarIdentity}>
      {initials ? (
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
            accent.classes.iconChip,
          )}
        >
          {initials}
        </span>
      ) : (
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            accent.classes.iconChip,
          )}
        >
          {Icon && <Icon className="size-4.5" />}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        {badge || (subtitle && <p className="truncate text-[11px] text-slate-500">{subtitle}</p>)}
      </div>
    </div>
  )
}

/** Friendly guard screen shown when a signed-in account lacks this role. */
export function RoleDenied({ icon: Icon, title, children, actions }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.6)]">
        <Icon className="size-7" />
      </span>
      <h1 className={cn('mt-6', typography.h1)}>{title}</h1>
      <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{children}</p>
      {actions && <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}

export default RoleShell
