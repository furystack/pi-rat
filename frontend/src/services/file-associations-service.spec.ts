import { describe, it, expect } from 'vitest'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { FileAssociationsService } from './file-associations-service.js'

describe('FileAssociationsService', () => {
  describe('getServiceForFile', () => {
    describe('video-player', () => {
      const videoExtensions = [
        'mp4',
        'webm',
        'ogg',
        'avi',
        'mov',
        'wmv',
        'flv',
        'mkv',
        'mpg',
        'mpeg',
        'm4v',
        '3gp',
        '3g2',
        'f4v',
        'f4p',
        'f4a',
        'f4b',
      ]

      it.each(videoExtensions)('should return video-player for .%s files', async (ext) => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', `movie.${ext}`)

          expect(result).toBe('video-player')
        })
      })

      it('should handle video files in nested paths', async () => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', 'folder/subfolder/movie.mkv')

          expect(result).toBe('video-player')
        })
      })
    })

    describe('music-player', () => {
      const musicExtensions = ['mp3', 'wav', 'flac', 'aac', 'wma', 'm4a', 'm4b', 'm4p', 'm4r']

      it.each(musicExtensions)('should return music-player for .%s files', async (ext) => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', `song.${ext}`)

          expect(result).toBe('music-player')
        })
      })
    })

    describe('image-viewer', () => {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg']

      it.each(imageExtensions)('should return image-viewer for .%s files', async (ext) => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', `image.${ext}`)

          expect(result).toBe('image-viewer')
        })
      })
    })

    describe('monaco-editor', () => {
      const editorExtensions = [
        'js',
        'ts',
        'json',
        'html',
        'css',
        'scss',
        'less',
        'md',
        'txt',
        'mjs',
        'jsx',
        'tsx',
        'vue',
        'yml',
        'yaml',
      ]

      it.each(editorExtensions)('should return monaco-editor for .%s files', async (ext) => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', `file.${ext}`)

          expect(result).toBe('monaco-editor')
        })
      })
    })

    describe('unknown extensions', () => {
      it('should return null for unknown extension', async () => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', 'document.xyz')

          expect(result).toBeNull()
        })
      })

      it('should return null for file without extension', async () => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', 'Makefile')

          expect(result).toBeNull()
        })
      })

      it('should return null for common non-media files', async () => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result1 = await service.getServiceForFile('A', 'document.pdf')
          const result2 = await service.getServiceForFile('A', 'archive.zip')
          const result3 = await service.getServiceForFile('A', 'program.exe')

          expect(result1).toBeNull()
          expect(result2).toBeNull()
          expect(result3).toBeNull()
        })
      })
    })

    describe('edge cases', () => {
      it('should handle files with multiple dots in name', async () => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', 'movie.2024.1080p.mkv')

          expect(result).toBe('video-player')
        })
      })

      it('should use last extension segment', async () => {
        await usingAsync(new Injector(), async (injector) => {
          const service = injector.getInstance(FileAssociationsService)

          const result = await service.getServiceForFile('A', 'archive.tar.gz')

          expect(result).toBeNull() // .gz is not a known extension
        })
      })
    })
  })
})
