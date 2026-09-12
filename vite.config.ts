import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the embeddable widget: a single self-contained IIFE plus one
// stylesheet, both with stable (unhashed) filenames so the Shopify Liquid
// section can hardcode their URLs and never needs re-editing after a redeploy.
export default defineConfig(({ command }) => ({
  plugins: [react()],

  // React checks process.env.NODE_ENV at runtime; an IIFE loaded straight into
  // a storefront has no `process`, so pin it at build time.
  define:
    command === 'build'
      ? { 'process.env.NODE_ENV': JSON.stringify('production') }
      : {},

  build: {
    target: 'es2020',
    lib: {
      entry: 'src/widget.tsx',
      name: 'RingViewerWidget',
      formats: ['iife'],
      fileName: () => 'ring-viewer.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (asset) => {
          const info = asset as { names?: string[]; name?: string }
          const name = info.names?.[0] ?? info.name ?? ''
          return name.endsWith('.css')
            ? 'ring-viewer.css'
            : 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
}))
