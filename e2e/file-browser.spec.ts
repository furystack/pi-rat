import { test, expect } from '@playwright/test'
import { assertAndDismissNoty, login, uploadFile } from './helpers'
import { join } from 'path'
import { readFileSync } from 'fs'

test.describe('File Browser', () => {
  test('Should be able to create a drive in the temp directory', async ({ page, browserName }) => {
    const tempPath = join((process as any).env?.E2E_TEMP || process.cwd(), 'browser-temp', browserName)

    await page.goto('/')

    await login(page)

    await page.locator('icon-url-widget', { hasText: 'File Browser' }).click()

    const addFab = await page.getByRole('button', { name: '+' })
    addFab.click()

    await page.getByRole('heading', { name: 'Add Drive' })

    const letterInput = await page.getByRole('textbox', { name: 'letter' })

    await letterInput.fill(browserName[0])

    const pathInput = await page.getByRole('textbox', { name: 'Physical path' })
    await pathInput.fill(tempPath)

    const submitButton = await page.getByRole('button', { name: 'Finish' })
    await submitButton.click()

    await assertAndDismissNoty(page, `Drive '${browserName[0]}' has been created succesfully`)
    await page.getByText('- No Data -')
    // TODO: Upload files
  })

  test.only('Should able to upload a file', async ({ page }) => {
    await page.goto('/')
    await login(page)
    await page.locator('icon-url-widget', { hasText: 'File Browser' }).click()

    await uploadFile(page, './e2e/test-files/upload.md', 'text/markdown')
  })
})
