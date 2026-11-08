import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

// Served from https://dben.github.io/wizard-type/ on GitHub Pages.
export default defineConfig({
  base: '/wizard-type/',
  plugins: [preact()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
