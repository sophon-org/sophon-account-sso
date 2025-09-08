import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: [
      'src/**/*.ts',
      'src/**/*.tsx',
      '!src/**/*.spec.ts',
      '!src/**/*.spec.tsx',
      '!src/**/*.test.ts',
      '!src/**/*.test.tsx',
    ],
    // entry: [
    //   'src/*',
    //   'src/hooks/*',
    //   'src/components/*',
    //   'src/utils/*',
    //   'src/types/*',
    // ],
    splitting: false,
    sourcemap: !!options.watch,
    clean: true,
    minify: !options.watch,
    external: ['react', 'react-dom', 'wagmi', 'viem', '@tanstack/react-query'],
    treeshake: false,
    bundle: false,
    dts: true,
    format: ['esm', 'cjs'],
    outDir: 'dist',
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
  };
});
