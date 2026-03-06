import { expect, test, type Page } from '@playwright/test'
import { rmSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { assertAndDismissNoty, login, uploadFile } from './helpers.js'

let tempPath: string
let tempDriveLetter: string

const gotoFileBrowser = async (page: Page) => {
  await page.locator('shade-app-bar-link', { hasText: 'Files' }).click()
  await expect(page.getByRole('button', { name: '+' })).toBeVisible()
}

const createDrive = async (page: Page, drivePath: string, driveLetter: string) => {
  const addFab = page.getByRole('button', { name: '+' })
  await expect(addFab).toBeVisible()
  await addFab.click()

  const wizardHeader = page.getByRole('heading', { name: 'Add Drive' })
  await expect(wizardHeader).toBeVisible()

  const letterInput = page.getByRole('textbox', { name: 'letter' })
  await letterInput.fill(driveLetter)

  const pathInput = page.getByRole('textbox', { name: 'Physical path' })
  await pathInput.fill(drivePath)

  const submitButton = page.getByRole('button', { name: 'Finish' })
  await submitButton.click()

  await assertAndDismissNoty(page, `Drive '${driveLetter}' has been created successfully`)
}

const selectDrive = async (page: Page, driveLetter: string) => {
  const selector = page.locator('drive-selector shade-select').nth(0)
  await expect(selector).toBeVisible()

  const combobox = selector.locator('[role="combobox"]')
  await expect(combobox).toBeVisible()
  await combobox.click()

  const option = selector.locator('[role="option"]', { hasText: driveLetter })
  await expect(option).toBeVisible()
  await option.click()

  await expect(page.locator('folder-panel').nth(0)).toBeVisible()
}

const openFile = async (page: Page, fileName: string) => {
  const fileEntry = page.locator('folder-panel shades-data-grid-row').getByText(fileName).nth(0)
  await expect(fileEntry).toBeVisible()
  await fileEntry.dblclick()
}

const deleteFile = async (page: Page, fileName: string) => {
  const file = page.getByText(fileName).nth(0)
  await expect(file).toBeVisible()
  await file.click()
  await page.keyboard.press('Delete')
  await assertAndDismissNoty(page, 'The file is deleted succesfully')
}

test.describe('File Browser', () => {
  test.beforeAll(async ({ browser, browserName }) => {
    const { workerIndex } = test.info()
    tempDriveLetter = `test-${browserName[0]}${workerIndex}`
    tempPath = join(
      process.env?.E2E_TEMP || process.cwd(),
      'browser-temp',
      'file-browser-tests',
      `${browserName}-w${workerIndex}`,
    )

    // Pre-cleanup: remove leftover drive from a previous failed run
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await login(page)
    await page.request.delete(`/api/drives/volumes/${tempDriveLetter}`)
    await context.close()

    rmSync(tempPath, { recursive: true, force: true })
  })

  test.afterAll(async ({ browser }) => {
    // Post-cleanup: ensure drive and temp files are removed even if the test failed
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await login(page)
    await page.request.delete(`/api/drives/volumes/${tempDriveLetter}`)
    await context.close()

    rmSync(tempPath, { recursive: true, force: true })
  })

  test('Should be able to create a drive in the temp directory, upload and delete a file then remove the drive', async ({
    page,
    browserName,
  }) => {
    const { workerIndex } = test.info()
    const fileName = `upload-${browserName[0]}${workerIndex}.md`

    await page.goto('/')
    await login(page)

    await gotoFileBrowser(page)

    await createDrive(page, tempPath, tempDriveLetter)

    await selectDrive(page, tempDriveLetter)

    await uploadFile(page, './e2e/test-files/upload.md', 'text/markdown', fileName)

    await openFile(page, fileName)

    const fileContent = await readFile('./e2e/test-files/upload.md', { encoding: 'utf-8' })
    const editor = page.getByRole('textbox')
    await expect(editor).toBeVisible()
    expect(fileContent.replace(/[^a-zA-Z ]/g, '')).toContain((await editor.inputValue()).replace(/[^a-zA-Z ]/g, ''))

    await gotoFileBrowser(page)
    await selectDrive(page, tempDriveLetter)

    await deleteFile(page, fileName)

    await expect(page.getByText(fileName)).toHaveCount(0)

    await page.locator('shade-app-bar-link', { hasText: 'PI-Rat' }).click()

    await page.locator('icon-url-widget', { hasText: 'Drives' }).click()

    const driveLine = page.locator('shades-data-grid-row', { hasText: tempDriveLetter })
    await expect(driveLine).toBeVisible()
    await driveLine.locator('button[title="Delete"]').click()

    await assertAndDismissNoty(page, `🗑️ The selected entity deleted successfully`)

    await page.reload()

    await expect(driveLine).not.toBeVisible()
  })
})
