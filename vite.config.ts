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
    target: 'esnext', // Crucial: Prevents esbuild from attempting to transpile/rename symbols
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
             // 1. SDK Core + crypto sub-dependencies (must be colocated to preserve init order)
             if (
               id.includes('@aptos-labs/ts-sdk') || 
               id.includes('poseidon') || 
               id.includes('@noble') ||
               id.includes('@scure')
             ) {
               return 'aptos-sdk-core';
             }

             // 2. Razor Kit wallet provider (grouped to avoid its own init cycles)
             if (id.includes('@razorlabs') || id.includes('razorkit') || id.includes('@radix-ui')) {
               return 'wallet-suite';
             }

             // 2. Fragmented Adapters: Split these individually to avoid the "qe" symbol collision
             if (id.includes('wallet-adapter') || id.includes('radix') || id.includes('aptos-connect')) {
               return id.toString().split('node_modules/')[1].split('/')[0].toString();
             }

             // 3. Framework & React Suite
             if (id.includes('react') || id.includes('react-dom') || id.includes('firebase') || id.includes('framer-motion')) {
               return 'framework-suite';
             }

             // 4. Everything else: Individual chunks to prevent any identifier merging.
             return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  }
})
