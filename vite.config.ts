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
    target: 'es2020', // Better compatibility for mobile wallet browsers than esnext
    modulePreload: {
      polyfill: true,
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging since user has issues
        pure_funcs: ['console.info', 'console.debug']
      },
      mangle: {
        safari10: true, // Better compatibility for mobile/wallet browsers
      }
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

             // 2. Razor Kit core (Isolated to prevent init cycles)
             if (id.includes('@razorlabs') || id.includes('razorkit')) {
               return 'wallet-kit-core';
             }

             // 2.1 UI Primitives (Radix, etc) - Split from wallet kit to reduce initial load
             if (id.includes('@radix-ui')) {
               return 'ui-primitives';
             }

             // 2.2 Fragmented Adapters: Split these individually to avoid the "qe" symbol collision
             if (id.includes('wallet-adapter') || id.includes('aptos-connect')) {
               return id.toString().split('node_modules/')[1].split('/')[0].toString();
             }

             // 3. UI Suite: Group MUI, Emotion, and Material-React-Table together to prevent TDZ ReferenceErrors
             if (
               id.includes('@emotion') || 
               id.includes('@mui') || 
               id.includes('material-react-table')
             ) {
               return 'ui-suite';
             }

             // 3. React Core & Sync Shims (Isolated to prevent CJS/ESM shim initialization errors)
             if (id.includes('react') || id.includes('react-dom') || id.includes('use-sync-external-store')) {
               return 'react-vendor';
             }

             // 4. Framework Suite (Other heavy libraries)
             if (id.includes('firebase') || id.includes('framer-motion')) {
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
