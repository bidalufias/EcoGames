import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works on GitHub Pages sub-paths and any static host.
  base: './',
  build: {
    target: 'es2022',
    // Keep the 3D art images as separate cached files rather than base64 inside the JS.
    assetsInlineLimit: (file) => (file.includes('/assets/3d/') ? false : undefined),
    // Phaser is large and only loaded by action games, so it gets its own chunk.
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
