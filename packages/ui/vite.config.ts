import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/agents': 'http://localhost:3000',
      '/approvals': 'http://localhost:3000',
      '/notifications': 'http://localhost:3000',
      '/health': 'http://localhost:3000'
    }
  }
})
