import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development the API runs separately; in production CloudFront serves both under one origin
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
