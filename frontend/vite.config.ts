import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow network access for testing on mobile devices
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '.certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '.certs/cert.pem')),
    },
    watch: {
      usePolling: true,
      interval: 150,
    },
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
