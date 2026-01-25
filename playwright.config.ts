import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'

const isInCi = !!process.env.CI

const config: PlaywrightTestConfig = {
  forbidOnly: isInCi,
  testDir: 'e2e',
  fullyParallel: !isInCi, // Run tests in parallel locally, but serialize in CI to reduce resource contention
  retries: isInCi ? 2 : 0,
  workers: isInCi ? 2 : undefined, // Limit workers in CI to prevent resource exhaustion
  timeout: 60000, // 60 second timeout per test
  reporter: isInCi ? 'github' : 'line',
  expect: {
    timeout: 10000, // 10 second timeout for assertions
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      threshold: 0.3,
    },
  },
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:9090',
    actionTimeout: 15000, // 15 second timeout for actions like click, fill, etc.
    navigationTimeout: 30000, // 30 second timeout for navigation
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
}
export default config
