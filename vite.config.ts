import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    hmr: {
      overlay: false,
    },
    proxy: {
      '/fitbit': {
        target: 'https://api.fitbit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fitbit/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Switch back to esbuild as it's faster, manualChunks will fix the collision
    cssMinify: true,
    rollupOptions: {
      output: {
        // Splits each node_module into its own chunk to prevent symbol collisions
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  }
})
