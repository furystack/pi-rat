/**
 * Triggers a file download by creating a temporary anchor element.
 * This is the standard workaround for programmatic downloads in the browser.
 */
export const triggerDownload = (url: string, filename: string) => {
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
