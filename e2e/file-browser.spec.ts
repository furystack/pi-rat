import { expect, test } from '@playwright/test'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { assertAndDismissNoty, login, uploadFile } from './helpers.js'

test.describe('File Browser', () => {
  test('Should be able to create a drive in the temp directory', async ({ page, browserName }) => {
    const tempPath = join(process.env?.E2E_TEMP || process.cwd(), 'browser-temp', browserName)

    await page.goto('/')

    await login(page)

    await page.locator('icon-url-widget', { hasText: 'File Browser' }).click()

    const addFab = page.getByRole('button', { name: '+' })
    await addFab.click()

    page.getByRole('heading', { name: 'Add Drive' })

    const letterInput = page.getByRole('textbox', { name: 'letter' })

    await letterInput.fill(browserName[0])

    const pathInput = page.getByRole('textbox', { name: 'Physical path' })
    await pathInput.fill(tempPath)

    const submitButton = page.getByRole('button', { name: 'Finish' })
    await submitButton.click()

    await assertAndDismissNoty(page, `Drive '${browserName[0]}' has been created succesfully`)
    page.getByText('- No Data -')
  })

  test('Should able to upload a file', async ({ page }) => {
    await page.goto('/')
    await login(page)
    await page.locator('icon-url-widget', { hasText: 'File Browser' }).click()
    await uploadFile(page, './e2e/test-files/upload.md', 'text/markdown')
    await page.getByText('upload.md').nth(1).dblclick()

    const fileContent = await readFile('./e2e/test-files/upload.md', { encoding: 'utf-8' })
    const editor = page.locator('monaco-editor').getByRole('textbox')
    expect(fileContent.replace(/[^a-zA-Z ]/g, '')).toContain((await editor.inputValue()).replace(/[^a-zA-Z ]/g, ''))
  })
})
