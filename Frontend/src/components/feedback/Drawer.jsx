import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils.js'

// Mobile-first slide-in drawer. Anchors to the bottom on small screens and
// slides from the left on desktop-sized anchors if needed. Locks body
// scroll while open and closes on backdrop tap or Escape.
export function Drawer({ open, onClose, title, children, side = 'left', className }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const sideClasses =
    side === 'left'
      ? 'inset-y-0 left-0 w-[85vw] max-w-sm'
      : 'inset-y-0 right-0 w-[85vw] max-w-sm'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'absolute flex flex-col rounded-r-2xl bg-white shadow-lg',
              sideClasses,
              className,
            )}
            initial={{ x: side === 'left' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'left' ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
