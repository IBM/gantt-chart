import { resolve } from 'path';

import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['ibm-gantt-chart'],
  },
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'IBMGanttChartReact',
      fileName: (format) => `ibm-gantt-chart-react.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'ibm-gantt-chart'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'ibm-gantt-chart': 'Gantt',
        },
      },
    },
  },
});
