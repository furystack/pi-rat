import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { FileAssociationRegistry } from './file-association-registry.js'

describe('FileAssociationRegistry', () => {
  const createAssociation = (extensions: string[], handler: string) => ({
    extensions,
    handler,
    component: vi.fn(),
  })

  it('should register and retrieve a file association by extension', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileAssociationRegistry)
      const assoc = createAssociation(['mp4', 'mkv'], 'video-player')

      registry.registerAssociation(assoc)

      expect(registry.getAssociationForFile('video.mp4')).toBe(assoc)
      expect(registry.getAssociationForFile('movie.mkv')).toBe(assoc)
    })
  })

  it('should return undefined for unknown extension', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileAssociationRegistry)
      registry.registerAssociation(createAssociation(['mp4'], 'video-player'))

      expect(registry.getAssociationForFile('readme.txt')).toBeUndefined()
    })
  })

  it('should return undefined for file without extension', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileAssociationRegistry)
      registry.registerAssociation(createAssociation(['mp4'], 'video-player'))

      expect(registry.getAssociationForFile('Makefile')).toBeUndefined()
    })
  })

  it('should match case-insensitively', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileAssociationRegistry)
      const assoc = createAssociation(['jpg', 'png'], 'image-viewer')

      registry.registerAssociation(assoc)

      expect(registry.getAssociationForFile('photo.JPG')).toBe(assoc)
      expect(registry.getAssociationForFile('image.Png')).toBe(assoc)
    })
  })

  it('should return the first matching association when multiple match', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileAssociationRegistry)
      const assoc1 = createAssociation(['ts'], 'editor-1')
      const assoc2 = createAssociation(['ts'], 'editor-2')

      registry.registerAssociation(assoc1)
      registry.registerAssociation(assoc2)

      expect(registry.getAssociationForFile('file.ts')).toBe(assoc1)
    })
  })
})
