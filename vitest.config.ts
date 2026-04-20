// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/index.ts'],
    },
  },
});
