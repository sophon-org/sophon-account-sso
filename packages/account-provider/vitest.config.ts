/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test.setup.ts'],
    globals: true,
    include: ['src/**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      exclude: [
        'node_modules',
        'dist',
        'tsup.config.ts',
        'vitest.config.ts',
        // no need to cover the mainnet and testnet files
        'src/types.ts',
        'src/provider.ts',
        'src/index.ts'
      ],
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
  esbuild: {
    target: 'es2020',
  },
});
