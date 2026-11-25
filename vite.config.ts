import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// User site (muhammad-mas.github.io) is served from the domain root, so base is '/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts'],
  },
});
