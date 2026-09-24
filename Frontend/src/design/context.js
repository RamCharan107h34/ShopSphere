import { createContext, createElement, useContext, useMemo } from 'react'

/**
 * ShopSphere design system — the single source of truth for the UI.
 *
 * Everything visual lives here as plain Tailwind class strings, so there is no
 * bespoke CSS layer to keep in sync. Components import these maps (or read the
 * active role's accent through `useAccent`) instead of hardcoding colours.
 *
 * NOTE: class names are written out in full on purpose — Tailwind scans source
 * text, so a class assembled at runtime (`bg-${colour}-600`) would never be
 * generated.
 *
 * Structure
 *   1. ROLES         — one accent per role: 5 workspaces, one product
 *   2. AccentProvider— primitives inherit the accent of the workspace they're in
 *   3. layout        — the chrome shared by every screen (shell, sidebar, cards)
 *   4. surfaces      — card / panel / well / band recipes (radius + ring + depth)
 *   5. typography    — the type scale
 *   6. tones         — semantic status colours for badges, alerts and meters
 */

/* ------------------------------------------------------------------ */
/* Depth & surface recipes                                             */
/* ------------------------------------------------------------------ */

/**
 * Layered, low-opacity shadows. A single soft shadow reads flat; a tight
 * contact shadow plus a wide diffused one reads like real elevation.
 */
export const elevation = {
  hairline: 'shadow-[0_0_0_1px_rgba(15,23,42,0.05)]',
  contact: 'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_1px_rgba(15,23,42,0.02)]',
  soft: 'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-18px_rgba(15,23,42,0.22)]',
  lift: 'shadow-[0_2px_4px_rgba(15,23,42,0.04),0_20px_44px_-22px_rgba(15,23,42,0.28)]',
  pop: 'shadow-[0_28px_70px_-28px_rgba(15,23,42,0.38)]',
  inner: 'shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
}

/** Reusable surface recipes: `surfaces.card`, `surfaces.panel`, … */
export const surfaces = {
  card: `rounded-2xl bg-white ring-1 ring-slate-900/[0.06] ${elevation.soft}`,
  cardHover:
    'rounded-2xl bg-white ring-1 ring-slate-900/[0.06] transition-all duration-300 hover:-translate-y-0.5 hover:ring-slate-900/[0.09] hover:shadow-[0_4px_8px_rgba(15,23,42,0.05),0_24px_48px_-24px_rgba(15,23,42,0.3)]',
  panel: `rounded-3xl bg-white ring-1 ring-slate-900/[0.06] ${elevation.lift}`,
  well: 'rounded-2xl bg-slate-50 ring-1 ring-inset ring-slate-900/[0.05]',
  glass: 'rounded-2xl bg-white/80 ring-1 ring-white/60 backdrop-blur-xl',
  dark: 'rounded-3xl bg-slate-950 ring-1 ring-white/10 text-white',
  dashed: 'rounded-2xl border border-dashed border-slate-300 bg-white/60',
  interactive:
    'rounded-2xl bg-white ring-1 ring-slate-900/[0.06] transition-all duration-200 hover:-translate-y-0.5 hover:ring-slate-900/[0.1] hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.3)]',
}

/* ------------------------------------------------------------------ */
/* Type scale                                                          */
/* ------------------------------------------------------------------ */

/** Display/heading sizes use Plus Jakarta Sans (`font-display`). */
export const typography = {
  display:
    'font-display text-[2.5rem] leading-[1.05] font-extrabold tracking-[-0.035em] text-slate-900 sm:text-5xl lg:text-[3.5rem]',
  h1: 'font-display text-2xl font-extrabold tracking-[-0.025em] text-slate-900 sm:text-[1.75rem]',
  h2: 'font-display text-xl font-bold tracking-[-0.02em] text-slate-900',
  h3: 'font-display text-base font-bold tracking-[-0.01em] text-slate-900',
  lead: 'text-base leading-relaxed text-slate-600 sm:text-lg',
  body: 'text-sm leading-relaxed text-slate-600',
  muted: 'text-sm text-slate-500',
  micro: 'text-xs text-slate-500',
  eyebrow: 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400',
  eyebrowOnDark: 'text-[11px] font-bold uppercase tracking-[0.16em] text-white/70',
  numeric: 'tabular-nums tracking-tight',
}

/* ------------------------------------------------------------------ */
/* Role accents                                                        */
/* ------------------------------------------------------------------ */

/**
 * One product, five accents. Every role keeps the same white shell, spacing
 * and typography — only the accent shifts:
 *
 *   customer → teal     #0F766E   (storefront chrome is deep teal #102A2A)
 *   seller   → indigo   #4F46E5
 *   admin    → slate    #334155
 *   support  → cyan     #0891B2
 *   delivery → emerald  #059669
 *
 * Coral (#FF6B6B) is the marketplace's accent — never a whole role, only
 * highlights: discounts, primary calls to action, live counters.
 */

/** Brand constants used where the accent should not drift with the role. */
export const brand = {
  deepTeal: 'bg-deep-teal',
  tealCard: 'bg-teal-card',
  ivory: 'bg-ivory',
  coral: 'bg-coral',
  coralText: 'text-coral',
  coralRing: 'ring-coral/30',
}
export const ROLES = {
  customer: {
    key: 'customer',
    label: 'Customer',
    workspace: 'Your account',
    hint: 'Orders, wishlist and returns',
    icon: 'shopping-bag',
    classes: {
      solid: 'bg-teal-700 text-white hover:bg-teal-800 shadow-[0_10px_28px_-14px_rgba(15,118,110,0.7)]',
      gradient: 'bg-gradient-to-br from-teal-600 via-teal-700 to-teal-deep',
      gradientText: 'from-teal-700 to-coral',
      band: 'bg-gradient-to-br from-deep-teal via-teal-card to-teal-800',
      bandGlow: 'bg-coral/20',
      glow: 'shadow-[0_16px_40px_-16px_rgba(15,118,110,0.6)]',
      fill: 'bg-teal-700',
      soft: 'bg-teal-50 text-teal-700',
      chip: 'bg-teal-50 text-teal-600',
      iconChip: 'bg-gradient-to-br from-teal-600 to-teal-deep text-white',
      chipRing: 'ring-teal-200',
      text: 'text-teal-700',
      textStrong: 'text-teal-800',
      link: 'text-teal-700 hover:text-teal-800',
      border: 'border-teal-200',
      borderStrong: 'border-teal-300',
      ring: 'ring-teal-600',
      focus: 'focus-visible:ring-teal-600',
      focusRing: 'focus:border-teal-500 focus:ring-teal-600/15',
      navActive: 'bg-teal-50 text-teal-700 ring-1 ring-teal-100',
      rail: 'bg-teal-700',
      dot: 'bg-coral',
      hoverBorder: 'hover:border-teal-300',
    },
  },
  seller: {
    key: 'seller',
    label: 'Seller',
    workspace: 'Seller workspace',
    hint: 'List, price and fulfil your catalogue',
    icon: 'store',
    classes: {
      solid: 'bg-indigo-600 text-white hover:bg-indigo-700',
      gradient: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800',
      gradientText: 'from-indigo-600 to-sky-400',
      band: 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900',
      bandGlow: 'bg-indigo-400/30',
      glow: 'shadow-[0_16px_40px_-16px_rgba(79,70,229,0.55)]',
      fill: 'bg-indigo-600',
      soft: 'bg-indigo-50 text-indigo-700',
      chip: 'bg-indigo-50 text-indigo-600',
      iconChip: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white',
      chipRing: 'ring-indigo-200',
      text: 'text-indigo-600',
      textStrong: 'text-indigo-700',
      link: 'text-indigo-600 hover:text-indigo-700',
      border: 'border-indigo-200',
      borderStrong: 'border-indigo-300',
      ring: 'ring-indigo-500',
      focus: 'focus-visible:ring-indigo-500',
      focusRing: 'focus:border-indigo-400 focus:ring-indigo-500/15',
      navActive: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
      rail: 'bg-indigo-600',
      dot: 'bg-indigo-500',
      hoverBorder: 'hover:border-indigo-300',
    },
  },
  admin: {
    key: 'admin',
    label: 'Administrator',
    workspace: 'Admin console',
    hint: 'Platform-wide control and moderation',
    icon: 'shield',
    classes: {
      solid: 'bg-slate-800 text-white hover:bg-slate-900',
      gradient: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900',
      gradientText: 'from-slate-700 to-slate-400',
      band: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950',
      bandGlow: 'bg-sky-400/20',
      glow: 'shadow-[0_16px_40px_-16px_rgba(30,41,59,0.6)]',
      fill: 'bg-slate-800',
      soft: 'bg-slate-100 text-slate-700',
      chip: 'bg-slate-100 text-slate-700',
      iconChip: 'bg-gradient-to-br from-slate-600 to-slate-800 text-white',
      chipRing: 'ring-slate-300',
      text: 'text-slate-700',
      textStrong: 'text-slate-800',
      link: 'text-slate-700 hover:text-slate-900',
      border: 'border-slate-300',
      borderStrong: 'border-slate-400',
      ring: 'ring-slate-500',
      focus: 'focus-visible:ring-slate-500',
      focusRing: 'focus:border-slate-400 focus:ring-slate-500/15',
      navActive: 'bg-slate-100 text-slate-900 ring-1 ring-slate-200',
      rail: 'bg-slate-700',
      dot: 'bg-slate-600',
      hoverBorder: 'hover:border-slate-400',
    },
  },
  support: {
    key: 'support',
    label: 'Support agent',
    workspace: 'Support desk',
    hint: 'Customer issue queue and resolutions',
    icon: 'headset',
    classes: {
      solid: 'bg-cyan-600 text-white hover:bg-cyan-700',
      gradient: 'bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-800',
      gradientText: 'from-cyan-600 to-sky-400',
      band: 'bg-gradient-to-br from-cyan-600 via-cyan-700 to-slate-900',
      bandGlow: 'bg-sky-400/30',
      glow: 'shadow-[0_16px_40px_-16px_rgba(8,145,178,0.5)]',
      fill: 'bg-cyan-600',
      soft: 'bg-cyan-50 text-cyan-700',
      chip: 'bg-cyan-50 text-cyan-600',
      iconChip: 'bg-gradient-to-br from-cyan-500 to-cyan-700 text-white',
      chipRing: 'ring-cyan-200',
      text: 'text-cyan-600',
      textStrong: 'text-cyan-700',
      link: 'text-cyan-600 hover:text-cyan-700',
      border: 'border-cyan-200',
      borderStrong: 'border-cyan-300',
      ring: 'ring-cyan-500',
      focus: 'focus-visible:ring-cyan-500',
      focusRing: 'focus:border-cyan-400 focus:ring-cyan-500/15',
      navActive: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100',
      rail: 'bg-cyan-600',
      dot: 'bg-cyan-500',
      hoverBorder: 'hover:border-cyan-300',
    },
  },
  delivery: {
    key: 'delivery',
    label: 'Delivery partner',
    workspace: 'Delivery run',
    hint: 'Pickups, drop-offs and shipment status',
    icon: 'truck',
    classes: {
      solid: 'bg-emerald-600 text-white hover:bg-emerald-700',
      gradient: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800',
      gradientText: 'from-emerald-600 to-teal-400',
      band: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900',
      bandGlow: 'bg-teal-400/30',
      glow: 'shadow-[0_16px_40px_-16px_rgba(5,150,105,0.5)]',
      fill: 'bg-emerald-600',
      soft: 'bg-emerald-50 text-emerald-700',
      chip: 'bg-emerald-50 text-emerald-600',
      iconChip: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
      chipRing: 'ring-emerald-200',
      text: 'text-emerald-600',
      textStrong: 'text-emerald-700',
      link: 'text-emerald-600 hover:text-emerald-700',
      border: 'border-emerald-200',
      borderStrong: 'border-emerald-300',
      ring: 'ring-emerald-500',
      focus: 'focus-visible:ring-emerald-500',
      focusRing: 'focus:border-emerald-400 focus:ring-emerald-500/15',
      navActive: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
      rail: 'bg-emerald-600',
      dot: 'bg-emerald-500',
      hoverBorder: 'hover:border-emerald-300',
    },
  },
}

export const roleNames = Object.keys(ROLES)

export const roleOf = (key) => ROLES[key] || ROLES.customer

/* ------------------------------------------------------------------ */
/* Accent context                                                      */
/* ------------------------------------------------------------------ */

/**
 * Lets shared primitives (Button, Badge, StatCard, …) pick up whichever role
 * workspace they render inside, so one component serves every dashboard while
 * still matching its accent.
 */
const AccentContext = createContext(ROLES.customer)

export function AccentProvider({ role = 'customer', children }) {
  const value = useMemo(() => roleOf(role), [role])
  return createElement(AccentContext.Provider, { value }, children)
}

export function useAccent() {
  return useContext(AccentContext)
}

/* ------------------------------------------------------------------ */
/* Layout chrome                                                       */
/* ------------------------------------------------------------------ */

/** Class maps shared by the four dashboards and the storefront shell. */
export const layout = {
  /** App canvas: a flat base plus a single soft accent wash at the top. */
  canvas:
    'bg-ivory bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(15,118,110,0.10),transparent_60%)]',
  shell:
    'min-h-[calc(100vh-4rem)] bg-ivory bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(15,118,110,0.10),transparent_60%)]',
  page: 'min-h-screen bg-ivory text-deep-teal antialiased',

  /** Dashboard columns: fixed rail on desktop, single column below. */
  grid: 'mx-auto max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-7 lg:py-8',

  /* ---- Sidebar --------------------------------------------------- */
  sidebar: `sticky top-24 space-y-1.5 rounded-3xl bg-white/90 p-3 ring-1 ring-slate-900/[0.06] backdrop-blur ${elevation.soft}`,
  sidebarIdentity: 'flex items-center gap-3 rounded-2xl bg-slate-50/80 p-3',
  navItem:
    'group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
  navIdle: 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
  navSignOut:
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600',
  mobileNav:
    'mb-5 flex gap-1.5 overflow-x-auto rounded-2xl bg-white/90 p-1.5 ring-1 ring-slate-900/[0.06] backdrop-blur [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden',

  /* ---- Panels ---------------------------------------------------- */
  panel: surfaces.card,
  panelHeader: 'flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4',
  panelTitle: typography.h3,
  panelBody: 'px-5 py-5',

  /* ---- Page headers --------------------------------------------- */
  pageTitle: typography.h1,
  pageSubtitle: 'mt-1.5 max-w-2xl text-sm text-slate-500',
  sectionTitle: typography.h3,

  /* ---- Stats ----------------------------------------------------- */
  stat: `group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-900/[0.06] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(15,23,42,0.05),0_24px_48px_-24px_rgba(15,23,42,0.28)] ${elevation.soft}`,
  statLabel: 'text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400',
  statValue: 'mt-3 font-display text-[1.75rem] leading-none font-extrabold tracking-[-0.03em] tabular-nums text-slate-900',
  statHint: 'mt-2 text-xs text-slate-500',

  /* ---- Lists & empty states -------------------------------------- */
  listRow: 'flex items-center justify-between gap-3 px-5 py-4',
  empty: 'px-5 py-12 text-center text-sm text-slate-500',
  inlineLink: 'text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900',

  /* ---- Forms ----------------------------------------------------- */
  field:
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
  fieldLabel: 'text-sm font-medium text-slate-700',

  /** Neutral secondary button surface. */
  outlineButton:
    'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-px hover:border-slate-300 hover:text-slate-900 hover:shadow-sm active:translate-y-0',
}

/* ------------------------------------------------------------------ */
/* Tones (badges, alerts, meters)                                      */
/* ------------------------------------------------------------------ */

/**
 * Semantic tone → Tailwind classes. Status metadata in lib/status.js names a
 * tone and the components resolve it here.
 */
export const tones = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  default: 'bg-violet-50 text-violet-700 ring-violet-200',
  secondary: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  outline: 'bg-white text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
}

/** Solid fills used by meters and progress bars. */
export const toneSolid = {
  neutral: 'bg-slate-300',
  default: 'bg-violet-500',
  secondary: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

/** Alert panels (inline notices, warnings, errors). */
export const alerts = {
  info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
}

/** Maps a tone to its soft background (used by alert icon chips). */
export const toneIcon = {
  info: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
}

/** Numeric text colours for stat deltas. */
export const toneText = {
  neutral: 'text-slate-500',
  default: 'text-violet-600',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
}

export default ROLES
