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
          // 1. Aptos Ecosystem (Cross-file const/static initializers)
          if (id.includes('@aptos-labs') || id.includes('@aptos-connect') || id.includes('aptos')) {
            return 'aptos-suite';
          }
          // 2. Wallet & Web3 Ecosystem
          if (id.includes('@wallet-standard') || id.includes('wallet-adapter') || 
              id.includes('@razorlabs') || id.includes('razorkit')) {
            return 'wallet-suite';
          }
          // 3. React Core (Must stay together)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // 5. Framework & Heavy Libs
          if (id.includes('firebase') || id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'framework-libs';
          }
          // 6. Everything else (Split individually to prevent symbol collisions)
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  }
})
