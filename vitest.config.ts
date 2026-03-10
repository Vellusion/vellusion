import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@vellusion/math': resolve(__dirname, 'packages/math/src/index.ts'),
      '@vellusion/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@vellusion/scene': resolve(__dirname, 'packages/scene/src/index.ts'),
      '@vellusion/globe': resolve(__dirname, 'packages/globe/src/index.ts'),
      '@vellusion/geometry': resolve(__dirname, 'packages/geometry/src/index.ts'),
      '@vellusion/datasources': resolve(__dirname, 'packages/datasources/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
    globals: true,
    passWithNoTests: true,
  },
});
