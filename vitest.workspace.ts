import { defineWorkspace } from 'vitest/config'

const cfg = defineWorkspace([
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
])

export default cfg
