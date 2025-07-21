import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // https://vitest.dev/guide/cli.html
    environment: 'jsdom',
    include: ['./src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],

    reporters: ['default'],
    outputFile: 'account-message-bridge.junit.xml',
    setupFiles: ['./test.setup.ts'],
    coverage: {
      exclude: [
        'node_modules',
        'dist',
        'storybook-static',
        '.storybook',
        '**/*.stories.*',
        '**/*.spec.*',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.mts',
        '**/*.config.mjs',
        '.next',
        '*.js',
      ],
      provider: 'v8',
      reporter: ['text', 'json'],
    },
  },
});
