import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// API calls go straight to the backend via VITE_API_URL (see .env / .env.example).
export default defineConfig({
  plugins: [react(), tailwindcss()],
})