import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar.jsx'
import { Footer } from './Footer.jsx'

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
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
