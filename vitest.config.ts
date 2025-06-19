import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ['common/src/**/*.ts', 'frontend/src/**/*.ts', 'service/src/**/*.ts'],
    },
    projects: [
      {
        test: {
          name: 'Common',
          include: ['common/src/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'Service',
          include: ['service/src/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'Frontend',
          environment: 'jsdom',
          include: ['frontend/src/**/*.spec.(ts|tsx)'],
        },
      },
    ],
  },
})
