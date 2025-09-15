import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    // Do NOT set a specific port unless you need to.
    // port: 5174, // <-- Remove this line
    // strictPort: true, // <-- Remove this line

    // `historyApiFallback` is not a standard Vite server option, it's from webpack.
    // Vite uses `historyFallback` under `server` as `historyApiFallback` is not needed for Vite.
    // The correct property is `server.fs.strict` or just rely on Vite's SPA fallback.
    // You can usually omit it unless you have a custom history fallback.
    watch: {
      usePolling: true,
      interval: 150,
    },
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
