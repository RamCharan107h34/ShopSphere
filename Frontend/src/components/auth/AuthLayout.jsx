import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BadgeCheck, Headset, ShoppingBag, Store, Truck } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const highlights = [
  { icon: Store, title: 'Shop from verified sellers', text: 'Every store is reviewed and approved by the platform.' },
  { icon: Truck, title: 'Track every delivery', text: 'Live shipment updates from warehouse to doorstep.' },
  { icon: BadgeCheck, title: 'Hassle-free returns', text: 'Raise a request and follow it until resolution.' },
  { icon: Headset, title: 'Support when you need it', text: 'Tickets, disputes, and refunds — all in one place.' },
]

// Shared visual shell for all auth screens: brand panel (desktop) + form area
export function AuthLayout({ eyebrow, title, subtitle, children, wide }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16">
      {/* Brand panel (desktop only) */}
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="hidden lg:block"
      >
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-950 p-10 text-white shadow-elevated">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <ShoppingBag className="size-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">ShopSphere</span>
          </div>

          <h2 className="mt-8 text-3xl font-bold leading-snug tracking-tight">
            Every store.
            <br />
            <span className="text-brand-200">One sphere.</span>
          </h2>

          <ul className="mt-10 space-y-6">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm text-brand-100/90">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.aside>

      {/* Form panel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn('mx-auto w-full', wide ? 'max-w-xl' : 'max-w-md')}
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-6">
            {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Back to <Link to="/" className="font-medium text-primary hover:underline">home</Link>
        </p>
      </motion.div>
    </div>
  )
}
