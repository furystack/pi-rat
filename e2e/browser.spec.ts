import { test, expect } from '@playwright/test'
import { assertAndDismissNoty, login } from './helpers'
import { join } from 'path'

test.describe('Browser', () => {
  test('Should be able to create a drive in the temp directory', async ({ page, browserName }) => {
    const tempPath = join((process as any).env?.E2E_TEMP || process.cwd(), 'browser-temp', browserName)

    console.log('Using temp path:', { tempPath })

    await page.goto('/')

    await login(page)

    const browserLink = await page.getByRole('link', { name: '💽 Browser' })
    expect(browserLink).toBeVisible()
    await browserLink.click()

    const addFab = await page.getByRole('button', { name: '+' })
    addFab.click()

    await page.getByRole('heading', { name: 'Add Drive' })

    const letterInput = await page.getByRole('textbox', { name: 'letter' })

    await letterInput.type(browserName[0])

    const pathInput = await page.getByRole('textbox', { name: 'Physical path' })
    await pathInput.type(tempPath)

    const submitButton = await page.getByRole('button', { name: 'Finish' })
    await submitButton.click()

    await assertAndDismissNoty(page, `Drive '${browserName[0]}' has been created succesfully`)

    await browserLink.click()

    await page.getByText('- No Data -')

    // TODO: Upload files
  })
})
