import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import type { DirectoryEntry } from 'common'
import { FileContextMenuRegistry, type FileContextMenuContribution } from './file-context-menu-registry.js'

const createEntry = (name: string): DirectoryEntry => ({
  name,
  isFile: true,
  isDirectory: false,
  isBlockDevice: false,
  isCharacterDevice: false,
  isSymbolicLink: false,
  isFIFO: false,
  isSocket: false,
})

describe('FileContextMenuRegistry', () => {
  it('should register and retrieve applicable contributions', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileContextMenuRegistry)
      const contribution: FileContextMenuContribution = {
        isApplicable: (_entry, _drive, path) => path.endsWith('.mp4'),
        getItems: () => [],
      }

      registry.registerContribution(contribution)

      const applicable = registry.getContributions(createEntry('video.mp4'), 'C', '/videos/video.mp4')
      expect(applicable).toEqual([contribution])
    })
  })

  it('should filter out non-applicable contributions', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileContextMenuRegistry)
      const videoContribution: FileContextMenuContribution = {
        isApplicable: (_entry, _drive, path) => path.endsWith('.mp4'),
        getItems: () => [],
      }
      const textContribution: FileContextMenuContribution = {
        isApplicable: (_entry, _drive, path) => path.endsWith('.txt'),
        getItems: () => [],
      }

      registry.registerContribution(videoContribution)
      registry.registerContribution(textContribution)

      const applicable = registry.getContributions(createEntry('readme.txt'), 'C', '/readme.txt')
      expect(applicable).toEqual([textContribution])
    })
  })

  it('should return empty array when no contributions match', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileContextMenuRegistry)
      const contribution: FileContextMenuContribution = {
        isApplicable: () => false,
        getItems: () => [],
      }

      registry.registerContribution(contribution)

      const applicable = registry.getContributions(createEntry('file.xyz'), 'C', '/file.xyz')
      expect(applicable).toEqual([])
    })
  })

  it('should return empty array when no contributions registered', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileContextMenuRegistry)
      const applicable = registry.getContributions(createEntry('file.txt'), 'C', '/file.txt')
      expect(applicable).toEqual([])
    })
  })

  it('should pass entry, driveLetter, and path to isApplicable', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const registry = injector.getInstance(FileContextMenuRegistry)
      const isApplicable = vi.fn().mockReturnValue(true)
      const contribution: FileContextMenuContribution = {
        isApplicable,
        getItems: () => [],
      }

      registry.registerContribution(contribution)

      const entry = createEntry('test.txt')
      registry.getContributions(entry, 'D', '/docs/test.txt')

      expect(isApplicable).toHaveBeenCalledWith(entry, 'D', '/docs/test.txt')
    })
  })
})
