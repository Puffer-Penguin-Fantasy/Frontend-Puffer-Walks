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
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      // Keep constructor names intact for crypto/wallet SDKs
      mangle: {
         keep_fnames: true
      },
      compress: {
        passes: 2,
        dead_code: true,
      },
    },
    rollupOptions: {
        // ULTIMATE STABILITY FIX:
        // Removing manualChunks entirely. 
        // This keeps all node_modules in a single vendor/index file, 
        // which prevents identifier collisions (the "qe" error) across different files
        // and resolves all temporal dead zone (TDZ) initialization cycles 
        // (the "Cannot read properties of undefined (reading 'poseidon1')" error).
    },
    chunkSizeWarningLimit: 6000,
  }
})
