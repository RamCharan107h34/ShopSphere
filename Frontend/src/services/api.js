import axios from 'axios'

export const TOKEN_KEY = 'shopsphere_token'
export const REFRESH_KEY = 'shopsphere_refresh_token'

// Single API client for the whole app.
// The backend sets a JWT cookie on login, but we also attach the returned
// token as a Bearer header so requests work from any origin.
// The backend origin comes from VITE_API_URL (.env — copy .env.example). There
// is no dev proxy, so calls are cross-origin and the backend must allow this
// origin via FRONTEND_URL in Backend/.env.
const apiBaseUrl = import.meta.env.VITE_API_URL

if (!apiBaseUrl) {
  // Without a proxy an empty base URL points at the Vite dev server itself and
  // every call 404s, so say it once rather than let it look like a backend bug.
  console.warn('[api] VITE_API_URL is not set — copy Frontend/.env.example to Frontend/.env')
}

export const api = axios.create({
  baseURL: apiBaseUrl || '',
  withCredentials: true,
  timeout: 15000,
})

// ---- Session token storage ------------------------------------------------
// The access token is short-lived (30m by default) and the refresh token is a
// long-lived rotating secret. Both live in localStorage so a reload resumes the
// session; the refresh token is retired server-side on every exchange.
export const readTokens = () => ({
  token: localStorage.getItem(TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_KEY),
})

export const saveTokens = ({ token, refreshToken }) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// Attach the saved token (if any) to every request
api.interceptors.request.use((config) => {
  const { token } = readTokens()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- Silent refresh --------------------------------------------------------
// One shared in-flight refresh for the whole app. A page can easily fire five
// requests that all expire together; without single-flight they would each
// rotate the token, and four of the five rotations would be rejected as replayed
// (the server retires each presented refresh token). Everyone waits on the same
// promise instead.
let refreshInFlight = null

const performRefresh = async () => {
  const { refreshToken } = readTokens()
  if (!refreshToken) return null

  try {
    // Bare axios, not `api`: this call must not run through the interceptor
    // that is waiting on it.
    const { data } = await axios.post(
      `${api.defaults.baseURL}/user-api/refresh`,
      { refreshToken },
      { withCredentials: true, timeout: 15000 },
    )

    saveTokens({ token: data.token, refreshToken: data.refreshToken })
    return data.token
  } catch {
    clearTokens()
    return null
  }
}

export const refreshSession = () => {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

// Retry a request once with a fresh access token. If the refresh fails the
// original 401 is surfaced, and the app's own guards handle the signed-out state.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    const isAuthEndpoint =
      config?.url?.includes('/user-api/refresh') ||
      config?.url?.includes('/user-api/login') ||
      config?.url?.includes('/user-api/register')

    if (response?.status === 401 && config && !config.__retried && !isAuthEndpoint) {
      config.__retried = true

      const freshToken = await refreshSession()
      if (freshToken) {
        config.headers.Authorization = `Bearer ${freshToken}`
        return api.request(config)
      }
    }

    return Promise.reject(error)
  },
)

// Turn backend errors into a friendly message the forms can display
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback
  if (axios.isCancel(error)) return 'Request was cancelled.'

  const data = error.response?.data
  if (data) {
    // The global error middleware sends: { message: "error occurred", error: "detail" }
    return data.error || data.message || fallback
  }
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond.'
  if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?'

  return fallback
}

export default api
