import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: ['src/**/*.ts'],
    splitting: true,
    sourcemap: !!options.watch,
    clean: true,
    treeshake: true,
    minify: !options.watch,
    dts: true,
    format: ['esm', 'cjs'],
    outDir: 'dist',
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
    external: ['zksync-sso'],
  };
});
