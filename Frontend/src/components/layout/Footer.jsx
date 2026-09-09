import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

const columns = [
  {
    heading: 'Marketplace',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Shop by category', to: '/#categories' },
      { label: 'Featured products', to: '/#featured' },
      { label: 'Trending now', to: '/#trending' },
      { label: 'Best sellers', to: '/#best-sellers' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/register' },
      { label: 'Forgot password', to: '/forgot-password' },
    ],
  },
  {
    heading: 'Roles',
    links: [
      { label: 'Customer', to: '/register' },
      { label: 'Seller', to: '/register/seller' },
      { label: 'Admin & Support', to: '/login' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Shop<span className="text-primary">Sphere</span>
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            A multi-vendor e-commerce marketplace — five roles, one platform. Built with the MERN
            stack and a modern design system.
          </p>
        </div>

        {/* Link columns */}
        {columns.map((column) => (
          <div key={column.heading}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {column.heading}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} ShopSphere. Student mini project.</p>
          <Link to="/design-system" className="text-muted-foreground transition-colors hover:text-foreground">
            Design system
          </Link>
        </div>
      </div>
    </footer>
  )
}
