import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    pool: 'forks',
    server: {
      deps: {
        external: ['swisseph-v2'],
      },
    },
  },
});
