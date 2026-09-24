import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils.js'
import { layout, useAccent } from '../../design/context.js'

/**
 * Nav list shared by the four role dashboards. The active item picks up the
 * surrounding role's accent, so the seller / admin / support / delivery
 * sidebars stay structurally identical while matching their own colour.
 */
export function RoleNav({ items, onNavigate, pill = false, className }) {
  const accent = useAccent()

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                layout.navItem,
                pill ? 'rounded-full px-3.5 py-1.5 whitespace-nowrap' : 'w-full',
                isActive ? cn(accent.classes.navActive, 'font-semibold') : layout.navIdle,
                className,
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Accent rail marks the current section */}
                {isActive && !pill && (
                  <span
                    className={cn(
                      'absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full',
                      accent.classes.rail,
                    )}
                  />
                )}
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    isActive ? accent.classes.text : 'text-slate-400 group-hover:text-slate-500',
                  )}
                />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </>
  )
}

export default RoleNav
