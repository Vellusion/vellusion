import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true,
  },
  assetsInclude: ['**/*.wgsl'],
  resolve: {
    alias: {
      '@vellusion/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@vellusion/math': resolve(__dirname, '../../packages/math/src/index.ts'),
    },
  },
});
