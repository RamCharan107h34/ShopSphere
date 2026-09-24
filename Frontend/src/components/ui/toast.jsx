import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const ToastContext = createContext(null)

// Default auto-dismiss in ms
const DEFAULT_DURATION = 4000

const variantConfig = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-500' },
  error: { icon: XCircle, iconClass: 'text-red-600' },
  warning: { icon: TriangleAlert, iconClass: 'text-amber-600' },
  info: { icon: Info, iconClass: 'text-violet-600' },
}

// Provider: mount once near the app root
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = DEFAULT_DURATION }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((current) => [...current, { id, title, description, variant }])

      if (duration !== Infinity) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Viewport */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        <AnimatePresence>
          {toasts.map((item) => {
            const config = variantConfig[item.variant] || variantConfig.info
            const Icon = config.icon
            return (
              <motion.div
                key={item.id}
                layout
                role="status"
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg"
              >
                <Icon className={cn('mt-0.5 size-4 shrink-0', config.iconClass)} />
                <div className="min-w-0 flex-1">
                  {item.title && <p className="text-sm leading-tight font-semibold text-slate-900">{item.title}</p>}
                  {item.description && (
                    <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>')
  }
  return context
}
