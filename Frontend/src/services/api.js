import axios from 'axios'

export const TOKEN_KEY = 'shopsphere_token'

// Single API client for the whole app.
// The backend sets a JWT cookie on login, but we also attach the returned
// token as a Bearer header so requests work from any origin.
// Same-origin by default: the Vite dev server proxies /xxx-api prefixes to
// the Express backend (see vite.config.js). Set VITE_API_URL to call a
// deployed backend directly instead.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  timeout: 15000,
})

// Attach the saved token (if any) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
