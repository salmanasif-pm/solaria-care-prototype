import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps the build relocatable (domain root, GitHub Pages project path, or any static bucket).
// Routing uses the URL hash, so deep links and refresh work without server rewrite rules.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: false, target: 'es2020' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as any);
