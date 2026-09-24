import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// No dev proxy: the app calls Express directly at VITE_API_URL, read from
// .env (gitignored — copy .env.example to create it). Those calls are
// cross-origin, so the backend's CORS allow-list must include this dev origin:
// FRONTEND_URL in Backend/.env, which defaults to http://localhost:5173.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
