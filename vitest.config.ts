import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ['common/src/**/*.ts', 'frontend/src/**/*.ts', 'service/src/**/*.ts'],
    },
  },
})
