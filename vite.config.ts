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
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Refined chunking: Group tightly coupled libraries to avoid circular dependency / constructor issues
        manualChunks(id) {
          // Group all Aptos and Wallet related libs together
          if (id.includes('@aptos-labs') || id.includes('@aptos-connect') || id.includes('@wallet-standard')) {
            return 'aptos-suite';
          }
          // Group other heavy framework libs
          if (id.includes('firebase') || id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'framework-libs';
          }
          // Default vendor chunk for other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  }
})
