import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    css: true,
    exclude: [...configDefaults.exclude, 'test/timetable/activitytext.test.js'],
    setupFiles: ['./vitest.setup.js'],
  },
});
