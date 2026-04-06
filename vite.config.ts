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
      compress: {
        keep_fnames: true,
        keep_classnames: true,
      },
      mangle: {
        keep_fnames: true,
        keep_classnames: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
