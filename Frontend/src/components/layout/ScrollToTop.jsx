import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

/**
 * Floating "back to top" control.
 *
 * Appears only once the page has been scrolled past the first viewport, so it
 * never competes with the hero. Hidden from assistive tech while invisible.
 */
export function ScrollToTop({ threshold = 420 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll back to top"
          className="fixed right-5 bottom-5 z-40 flex size-11 items-center justify-center rounded-full bg-deep-teal text-coral-soft shadow-[0_16px_40px_-16px_rgba(16,42,42,0.8)] ring-1 ring-white/10 transition-colors hover:bg-teal-card hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:right-8 sm:bottom-8"
        >
          <ArrowUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default ScrollToTop
