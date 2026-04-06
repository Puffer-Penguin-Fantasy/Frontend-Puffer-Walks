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
    minify: 'esbuild', // Switch back to esbuild but with safety on
    cssMinify: true,
    lib: false,
    // THE FIX: Disable name changes used by some libraries that cause collisions
    terserOptions: {
      mangle: false, // Don't mangle variable names
      compress: true,
    },
  },
  esbuild: {
    // THE FIX: Explicitly tell esbuild NOT to minify identifiers
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
    keepNames: true,
  }
})
