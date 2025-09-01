import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.test.ts'],
    splitting: false,
    sourcemap: !!options.watch,
    clean: true,
    treeshake: false,
    bundle: false,
    minify: !options.watch,
    dts: true,
    format: ['esm', 'cjs'],
    outDir: 'dist',
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  };
});
