import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es'], fileName: 'index' },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        '@vellusion/math', '@vellusion/core', '@vellusion/scene', '@vellusion/globe',
        '@vellusion/geometry', '@vellusion/datasources', '@vellusion/tiles3d',
        '@vellusion/model', '@vellusion/particles', '@vellusion/analysis',
        '@vellusion/widgets',
      ],
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
