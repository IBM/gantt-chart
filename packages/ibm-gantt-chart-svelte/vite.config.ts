import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    include: ['ibm-gantt-chart'],
  },
})
