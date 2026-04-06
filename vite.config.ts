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
    minify: 'terser', // Terser is better at handling complex re-bundling
    terserOptions: {
      mangle: true, // Keep it true but safe
      compress: true
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // GROUPING: Keep all Aptos SDK and Connect modules together 
          // to fix initialization order / static field initialization bugs.
          if (id.includes('@aptos-labs') || id.includes('@aptos-connect') || id.includes('aptos')) {
            return 'aptos-suite';
          }
          // GROUPING: Keep wallet-specific libs together
          if (id.includes('@wallet-standard') || id.includes('wallet-adapter')) {
             return 'wallet-suite';
          }
          // SPLITTING: Split ALL OTHER library to its own chunk 
          // to prevent symbol collisions between different packages.
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  }
})
