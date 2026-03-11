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
      '@vellusion/model': resolve(__dirname, '../../packages/model/src/index.ts'),
    },
  },
});
