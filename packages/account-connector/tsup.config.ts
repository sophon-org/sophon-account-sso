import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: ['src/**/*.ts', '!src/**/*.spec.ts'],
    splitting: false,
    sourcemap: !!options.watch,
    clean: true,
    bundle: true,
    treeshake: true,
    minify: !options.watch,
    dts: true,
    format: ['esm', 'cjs'],
    outDir: 'dist',
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
    external: ['viem', '@wagmi/core'],
  };
});
