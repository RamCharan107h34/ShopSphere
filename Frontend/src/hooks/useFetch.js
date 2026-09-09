import { useEffect, useRef, useState } from 'react'

// Minimal data-fetching hook: fn is an async () => payload.
// The fetcher is intentionally NOT in the dependency list — callers pass
// inline lambdas, so depend on the caller-provided `deps` only.
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const refetch = async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const data = await fnRef.current()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({ data: null, loading: false, error })
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false
    setState((current) => ({ ...current, loading: true, error: null }))
    // Promise.resolve lets fetchers return a plain value (e.g. null) to mean "nothing to load"
    Promise.resolve(fn())
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }))
    return () => {
      cancelled = true
    }
  }, deps)

  return { ...state, refetch }
}
