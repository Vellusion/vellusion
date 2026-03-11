import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es'], fileName: 'index' },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { external: ['@vellusion/math', '@vellusion/core', '@vellusion/scene'] },
  },
  plugins: [dts({ rollupTypes: true })],
});
