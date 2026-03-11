import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true,
  },
  resolve: {
    alias: {
      '@vellusion/math': resolve(__dirname, '../../packages/math/src/index.ts'),
      '@vellusion/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@vellusion/scene': resolve(__dirname, '../../packages/scene/src/index.ts'),
      '@vellusion/globe': resolve(__dirname, '../../packages/globe/src/index.ts'),
      '@vellusion/tiles3d': resolve(__dirname, '../../packages/tiles3d/src/index.ts'),
    },
  },
});
