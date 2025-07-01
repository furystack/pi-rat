import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { assertAndDismissNoty, login, uploadFile } from './helpers.js'

const gotoFileBrowser = async (page: Page) => {
  await page.locator('shade-app-bar-link', { hasText: '📂 Files' }).click()
}

const createDrive = async (page: Page, tempPath: string, tempDriveLetter: string) => {
  const addFab = page.getByRole('button', { name: '+' })
  await addFab.click()

  const wizardHeader = page.getByRole('heading', { name: 'Add Drive' })
  await expect(wizardHeader).toBeVisible()

  const letterInput = page.getByRole('textbox', { name: 'letter' })
  await letterInput.fill(tempDriveLetter)

  const pathInput = page.getByRole('textbox', { name: 'Physical path' })
  await pathInput.fill(tempPath)

  const submitButton = page.getByRole('button', { name: 'Finish' })
  await submitButton.click()

  await assertAndDismissNoty(page, `Drive '${tempDriveLetter}' has been created succesfully`)
}

const selectDrive = async (page: Page, driveLetter: string) => {
  const selector = page.locator('drive-selector select').nth(0)
  await selector.selectOption(driveLetter)
}

const openFile = async (page: Page, fileName: string) => {
  const fileEntry = page.locator('folder-panel shades-data-grid-row').getByText(fileName).nth(0)

  await fileEntry.dblclick()
}

const deleteFile = async (page: Page, fileName: string) => {
  const file = page.getByText(fileName).nth(0)
  await file.click()
  await page.keyboard.press('Delete')
  await assertAndDismissNoty(page, 'The file is deleted succesfully')
}

test.describe('File Browser', () => {
  test('Should be able to create a drive in the temp directory, upload and delete a file then remove the drive', async ({
    page,
    browserName,
  }) => {
    const tempPath = join(process.env?.E2E_TEMP || process.cwd(), 'browser-temp', browserName)
    const tempDriveLetter = `test-${browserName[0]}`
    const fileName = 'upload.md'

    await page.goto('/')
    await login(page)

    await gotoFileBrowser(page)

    await createDrive(page, tempPath, tempDriveLetter)

    await selectDrive(page, tempDriveLetter)

    await uploadFile(page, './e2e/test-files/upload.md', 'text/markdown')

    await openFile(page, fileName)

    const fileContent = await readFile('./e2e/test-files/upload.md', { encoding: 'utf-8' })
    const editor = page.locator('monaco-editor').getByRole('textbox')
    expect(fileContent.replace(/[^a-zA-Z ]/g, '')).toContain((await editor.inputValue()).replace(/[^a-zA-Z ]/g, ''))

    await gotoFileBrowser(page)
    await selectDrive(page, tempDriveLetter)

    await deleteFile(page, fileName)

    const removedFileContent = page.locator('upload.md')
    await expect(removedFileContent).not.toBeVisible()

    await page.locator('shade-app-bar-link', { hasText: 'PI-Rat' }).click()

    await page.locator('icon-url-widget', { hasText: 'Drives' }).click()

    const driveLine = page.locator('shades-data-grid-row', { hasText: tempDriveLetter })
    await driveLine.locator('button', { hasText: '❌' }).click()

    await assertAndDismissNoty(page, `🗑️ The selected entity deleted successfully`)

    await page.reload()

    await expect(driveLine).not.toBeVisible()
  })
})
