import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '../ui/Button.jsx'

// Inline error state with an optional retry action. Use wherever a data
// fetch fails so the user sees what happened and can try again.
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-6 py-12 text-center ${className}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="size-6 text-red-600" />
      </span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RotateCw className="size-3.5" /> Try again
        </Button>
      )}
    </div>
  )
}
