import { Spinner } from '../ui/Spinner.jsx'

// Shown while the cached session is re-checked against the backend, so
// role-gated dashboards don't flash an "access denied" screen for a user whose
// role just changed (e.g. a store application that was approved moments ago).
export function SessionLoading({ label = 'Checking your session…' }) {
  return (
    <div className="mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <Spinner className="size-5 text-slate-400" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

export default SessionLoading
