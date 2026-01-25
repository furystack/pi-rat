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
    timeout: isInCi ? 30000 : 10000, // 30 second timeout for assertions in CI, 10 seconds locally
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      threshold: 0.3,
    },
  },
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:9090',
    actionTimeout: isInCi ? 30000 : 15000, // 30 second timeout for actions like click, fill, etc. in CI, 15 seconds locally
    navigationTimeout: isInCi ? 30000 : 15000, // 30 second timeout for navigation in CI, 15 seconds locally
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
