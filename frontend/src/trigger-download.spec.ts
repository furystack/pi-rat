import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { triggerDownload } from './trigger-download.js'

describe('triggerDownload', () => {
  let mockAnchor: { href: string; target: string; download: string; click: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockAnchor = {
      href: '',
      target: '',
      download: '',
      click: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement)
    vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement)
    vi.spyOn(document.body, 'removeChild').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create an anchor element with the correct attributes', () => {
    triggerDownload('https://example.com/file.zip', 'file.zip')

    expect(mockAnchor.href).toBe('https://example.com/file.zip')
    expect(mockAnchor.target).toBe('_blank')
    expect(mockAnchor.download).toBe('file.zip')
  })

  it('should append the anchor to the body, click it, and remove it', () => {
    triggerDownload('https://example.com/file.zip', 'file.zip')

    expect(document.body.appendChild).toHaveBeenCalledOnce()
    expect(mockAnchor.click).toHaveBeenCalledOnce()
    expect(document.body.removeChild).toHaveBeenCalledOnce()
  })

  it('should call operations in order: append, click, remove', () => {
    const callOrder: string[] = []
    vi.mocked(document.body.appendChild).mockImplementation(() => {
      callOrder.push('append')
      return mockAnchor as unknown as HTMLAnchorElement
    })
    mockAnchor.click.mockImplementation(() => {
      callOrder.push('click')
    })
    vi.mocked(document.body.removeChild).mockImplementation(() => {
      callOrder.push('remove')
      return mockAnchor as unknown as HTMLAnchorElement
    })

    triggerDownload('https://example.com/file.zip', 'file.zip')

    expect(callOrder).toEqual(['append', 'click', 'remove'])
  })
})
