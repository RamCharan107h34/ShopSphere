import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Headset,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
} from 'lucide-react'
import { cn } from '../../lib/utils.js'
import { ROLES } from '../../design/context.js'

const roleLinks = [
  { key: 'customer', label: 'Customer Account', note: 'Orders & wishlist', to: '/account/profile', icon: UserRound },
  { key: 'seller', label: 'Seller Portal', note: 'Catalog & analytics', to: '/seller', icon: Store },
  { key: 'admin', label: 'Admin Console', note: 'Platform controls', to: '/admin', icon: ShieldCheck },
  { key: 'support', label: 'Support Desk', note: 'Tickets & disputes', to: '/support', icon: Headset },
  { key: 'delivery', label: 'Delivery Run', note: 'Driver assignments', to: '/delivery', icon: Truck },
]

const columns = [
  {
    heading: 'Marketplace',
    links: [
      { label: 'All Products', to: '/products' },
      { label: 'Electronics', to: '/products?search=electronics' },
      { label: 'Fashion & Apparel', to: '/products?search=fashion' },
      { label: 'Home & Kitchen', to: '/products?search=home' },
      { label: 'Beauty & Wellness', to: '/products?search=beauty' },
      { label: 'Sports & Outdoors', to: '/products?search=sports' },
    ],
  },
  {
    heading: 'Customer Care',
    links: [
      { label: 'My Orders', to: '/account/orders' },
      { label: 'Wishlist', to: '/account/wishlist' },
      { label: 'Track Order', to: '/account/orders' },
      { label: 'Returns & Refunds', to: '/account/returns' },
      { label: 'Support Tickets', to: '/support/tickets' },
    ],
  },
  {
    heading: 'Sell With Us',
    links: [
      { label: 'Open a Storefront', to: '/register/seller' },
      { label: 'Seller Guidelines', to: '/register/seller' },
      { label: 'Commission & Payouts', to: '/register/seller' },
      { label: 'Seller Dashboard', to: '/seller' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#174747] bg-[#102A2A] text-slate-300">
      {/* Decorative gradient bloom */}
      <div className="pointer-events-none absolute -top-32 left-1/3 size-96 rounded-full bg-[#0F766E]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 size-80 rounded-full bg-[#FF6B6B]/5 blur-3xl" />

      {/* Main Footer Links */}
      <div className="relative mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        {/* Brand column */}
        <div className="space-y-4 lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9.5 items-center justify-center rounded-xl bg-[#0F766E] text-white shadow-md">
              <ShoppingBag className="size-5 text-[#FFE3D8]" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              Shop<span className="text-[#FF6B6B]">Sphear</span>
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            A modern, multi-vendor marketplace connecting verified sellers with discerning shoppers.
            Five roles, one unified platform with seamless checkout and end-to-end delivery tracking.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#174747] bg-[#174747]/60 px-3 py-1.5 text-xs text-slate-300">
              <ShieldCheck className="size-4 text-[#0F766E]" /> Buyer protection
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#174747] bg-[#174747]/60 px-3 py-1.5 text-xs text-slate-300">
              <Truck className="size-4 text-[#FF6B6B]" /> Live Delivery Run
            </span>
          </div>
        </div>

        {/* Link Columns */}
        {columns.map((col) => (
          <div key={col.heading}>
            <h4 className="font-display text-xs font-bold tracking-wider text-white uppercase">
              {col.heading}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-xs text-slate-400 transition hover:text-[#FF6B6B]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Role workspace drawer strip */}
      <div className="border-t border-[#174747] bg-[#0c1e1e]/60 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1440px]">
          <p className="mb-3 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Platform Roles &amp; Workspaces
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {roleLinks.map((r) => {
              const Icon = r.icon
              return (
                <Link
                  key={r.key}
                  to={r.to}
                  className="group flex items-center gap-2.5 rounded-xl border border-[#174747] bg-[#102A2A]/90 p-2.5 transition hover:border-[#0F766E] hover:bg-[#174747]"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#174747] text-[#FFE3D8] transition group-hover:bg-[#0F766E]">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{r.label}</p>
                    <p className="truncate text-[10px] text-slate-400">{r.note}</p>
                  </div>
                  <ArrowUpRight className="size-3 shrink-0 text-slate-500 transition group-hover:text-white" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="border-t border-[#174747]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} ShopSphear. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/products" className="hover:text-white">
              Catalogue
            </Link>
            <Link to="/support" className="hover:text-white">
              Help &amp; Support
            </Link>
            <span className="flex items-center gap-1 text-[#FF6B6B]">
              Crafted with <Heart className="size-3 fill-current" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
