import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths for production build (required for Electron file:// protocol)
  base: './',
  server: {
    // Use '0.0.0.0' to bind to all interfaces (localhost + network IP)
    // This allows both Electron app (localhost) and web UI (network IP) to work
    host: '0.0.0.0',
    port: 5173,
  },
})
