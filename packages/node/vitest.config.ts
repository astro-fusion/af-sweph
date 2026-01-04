import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        coverage: {
            exclude: [
                'dist/**',
                'prebuilds/**',
                'scripts/**',
                '**/*.d.ts',
                'src/index.ts', // Exports only
            ]
        }
    },
});
