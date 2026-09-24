import { Component } from 'react'

// Top-level safety net: if any screen throws during render, show a friendly
// full-page error instead of a white screen. Users can reload or go home.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Unhandled UI error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">⚠️</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Something went wrong</h1>
          <p className="max-w-md text-sm text-slate-500">
            An unexpected error occurred. Reloading usually fixes it — your cart and session are safe.
          </p>
          <div className="mt-2 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Reload page
            </button>
            <a
              href="/"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Back to home
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
