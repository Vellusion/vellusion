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
      '@vellusion/model': resolve(__dirname, 'packages/model/src/index.ts'),
      '@vellusion/tiles3d': resolve(__dirname, 'packages/tiles3d/src/index.ts'),
      '@vellusion/particles': resolve(__dirname, 'packages/particles/src/index.ts'),
      '@vellusion/analysis': resolve(__dirname, 'packages/analysis/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
    globals: true,
    passWithNoTests: true,
  },
});
