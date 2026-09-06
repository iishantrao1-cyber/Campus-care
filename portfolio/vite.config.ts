import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built site works from any sub-path / static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    // the sandbox previews the app through a proxied host
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 1800,
    target: 'es2022',
  },
})
