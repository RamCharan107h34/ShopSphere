import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navbar } from './Navbar.jsx'
import { Footer } from './Footer.jsx'
import { ScrollToTop } from './ScrollToTop.jsx'
import { CartDrawer } from '../shop/CartDrawer.jsx'
import { AccentProvider, layout } from '../../design/context.js'
import { cn } from '../../lib/utils.js'

export function Layout() {
  const { pathname, hash } = useLocation()

  // Scroll to top on route change (but keep #anchor jumps working)
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    } else {
      const target = document.querySelector(hash)
      target?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [pathname, hash])

  return (
    // Storefront + account pages run on the customer (teal) accent; role
    // dashboards re-provide their own accent further down the tree.
    <AccentProvider role="customer">
      <div className={cn('flex min-h-screen flex-col text-slate-900', layout.page)}>
        <Navbar />
        <main className="flex-1">
          {/* Each route fades in, so navigation feels deliberate rather than abrupt */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
        <Footer />

        {/* Summoned from anywhere: the navbar cart button, an add-to-cart
            toast action, or any component reading the cart context. */}
        <CartDrawer />
        <ScrollToTop />
      </div>
    </AccentProvider>
  )
}

export default Layout
