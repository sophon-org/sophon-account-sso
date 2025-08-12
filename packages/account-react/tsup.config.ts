import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: ['src/*', 'src/hooks/*', 'src/components/*'],
    splitting: true,
    sourcemap: !!options.watch,
    clean: true,
    minify: !options.watch,
    external: ['react', 'wagmi'],
    treeshake: false,
    dts: true,
    format: ['esm', 'cjs'],
    outDir: 'dist',
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
    // banner: {
    //   js: `"use client";`,
    // },
    // esbuildOptions(options) {
    //   options.banner = {
    //     js: '"use client"',
    //   };
    // },
  };
});
