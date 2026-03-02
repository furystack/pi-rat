import { test as base, expect } from '@playwright/test'

import type { ConsoleMessage } from '@playwright/test'

export const test = base.extend<{ consoleErrors: ConsoleMessage[]; pageErrors: Error[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: ConsoleMessage[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg)
        }
      })

      await use(errors)

      expect(errors.map((e) => e.text())).toEqual([])
    },
    { auto: true },
  ],

  pageErrors: [
    async ({ page }, use) => {
      const errors: Error[] = []

      page.on('pageerror', (error) => {
        errors.push(error)
      })

      await use(errors)

      expect(errors.map((e) => e.message)).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
