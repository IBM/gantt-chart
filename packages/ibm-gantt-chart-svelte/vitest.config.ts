import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    // Ensure the browser build of Svelte is used in tests, otherwise
    // `mount()` is unavailable (lifecycle_function_unavailable).
    conditions: process.env.VITEST ? ['browser'] : [],
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
  },
})
