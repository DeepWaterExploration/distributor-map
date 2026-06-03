/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'node',
          include: ['src/lib/__tests__/validateData.test.ts'],
          environment: 'node',
          globals: true,
        },
      },
      {
        test: {
          name: 'jsdom',
          include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
          exclude: ['src/lib/__tests__/validateData.test.ts'],
          environment: 'jsdom',
          globals: true,
        },
      },
    ],
  },
});
