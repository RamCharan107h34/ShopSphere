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
          <span className="flex size-16 items-center justify-center rounded-2xl bg-danger-50 text-3xl">⚠️</span>
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            An unexpected error occurred. Reloading usually fixes it — your cart and session are safe.
          </p>
          <div className="mt-2 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reload page
            </button>
            <a
              href="/"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
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
