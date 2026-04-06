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
    minify: 'terser',
    terserOptions: {
      mangle: {
         keep_fnames: true
      },
      compress: {
        passes: 2,
        dead_code: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
             // 1. Unified Wallet Suite: Groups all crypto and wallet-related libraries
             // (including their internal dependencies) to fix static field initialization cycles.
             if (
               id.includes('aptos') || 
               id.includes('wallet') || 
               id.includes('@noble')
             ) {
               return 'wallet-suite';
             }

             // 2. React Core Ecosystem
             if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
               return 'react-core';
             }
             
             // 3. Other Heavy Frameworks
             if (id.includes('firebase') || id.includes('framer-motion')) {
               return 'framework-libs';
             }

             // 4. Stable Catch-all: Prevents identifier collisions (the "qe" error)
             // by keeping miscellaneous packages in a grouped vendor chunk.
             return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 4000,
  }
})
