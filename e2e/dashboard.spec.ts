import type { Page } from '@playwright/test'

import { test, expect } from './fixtures.js'
import { randomUUID } from 'crypto'
import { assertAndDismissNoty, login } from './helpers.js'

const navigateToDashboardList = async (page: Page) => {
  await page.goto('/')
  await page.locator('shade-app-body').getByRole('link', { name: '📔 Dashboards' }).click()
}

const setMonacoValue = async (page: Page, value: any) => {
  await page.locator('.monaco-editor').click()

  const monaco = page.getByRole('textbox', { name: 'Editor content' })

  await monaco.press('ControlOrMeta+a')

  await monaco.type(JSON.stringify(value, null, 2))
  await monaco.press('ControlOrMeta+End', { delay: 10 })
  await monaco.press('Backspace', { delay: 10 })
}

const trySaveDashboard = async (page: Page) => {
  await page.getByRole('button', { name: 'Save' }).dispatchEvent('click')
}

test.describe('Dashboard', () => {
  test('should load the default dashboard by default', async ({ page }) => {
    await page.goto('/')
    await login(page)
    await page.waitForSelector('text=Apps')
    await page.waitForSelector('text=File browser')
  })

  test('create, customize and delete a dashboard', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Skip on FF')

    const dashboardName = `e2e-test-${randomUUID()}`

    await page.goto('/')
    await login(page)

    await navigateToDashboardList(page)
    await page.locator('button[is="shade-fab"]').click()

    await setMonacoValue(page, {
      name: dashboardName,
      description: '',
      widgets: [],
    })
    await trySaveDashboard(page)
    await assertAndDismissNoty(page, 'Error: Bad Request')

    await setMonacoValue(page, {
      name: dashboardName,
      description: '',
      widgets: [],
      owner: 'testuser@gmail.com',
    })
    await trySaveDashboard(page)
    await assertAndDismissNoty(page, 'Entity created successfully')

    await setMonacoValue(page, {
      name: dashboardName,
      description: '',
      widgets: [{ type: 'nooo' }],
      owner: 'testuser@gmail.com',
    })
    await trySaveDashboard(page)
    await assertAndDismissNoty(page, 'Error: Bad Request')

    await setMonacoValue(page, {
      name: dashboardName,
      description: '',
      widgets: [
        {
          type: 'markdown',
          content: `### Test Widget - ${dashboardName}`,
        },
      ],
      owner: 'testuser@gmail.com',
    })
    await trySaveDashboard(page)
    await assertAndDismissNoty(page, 'Entity updated successfully')

    await navigateToDashboardList(page)

    await page
      .locator('shades-data-grid-row')
      .filter({ hasText: dashboardName })
      .getByRole('link', { name: 'Preview' })
      .click()

    await page.waitForSelector(`text=Test Widget - ${dashboardName}`)

    await navigateToDashboardList(page)

    await page
      .locator('shades-data-grid-row')
      .filter({ hasText: dashboardName })
      .locator('button[title="Delete"]')
      .click()

    await page.reload()

    await navigateToDashboardList(page)

    const grid = page.locator('shade-data-grid')
    await expect(grid).not.toHaveText(dashboardName)
  })
})
