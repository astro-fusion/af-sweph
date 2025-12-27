import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    server: {
      deps: {
        external: ['swisseph-v2', 'node-gyp-build'],
      },
    },
  },
});
