import { describe, it, expect } from 'vitest'
import { sep } from 'path'
import { getPhysicalPath, getPhysicalParentPath } from './physical-path-utils.js'
import type { Drive, PiRatFile } from 'common'

describe('physical-path-utils', () => {
  const createDrive = (physicalPath: string): Drive => ({
    physicalPath,
    letter: 'A',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const createFile = (path: string): PiRatFile => ({
    driveLetter: 'A',
    path,
  })

  describe('getPhysicalPath', () => {
    it('should combine drive physical path with file path', () => {
      const drive = createDrive('/media/storage')
      const file = createFile('movies/movie.mkv')

      const result = getPhysicalPath(drive, file)

      expect(result).toBe(`/media/storage${sep}movies${sep}movie.mkv`)
    })

    it('should handle file at root of drive', () => {
      const drive = createDrive('/data')
      const file = createFile('file.txt')

      const result = getPhysicalPath(drive, file)

      expect(result).toBe(`/data${sep}file.txt`)
    })

    it('should handle deeply nested paths', () => {
      const drive = createDrive('/mnt/drive')
      const file = createFile('a/b/c/d/e/file.mkv')

      const result = getPhysicalPath(drive, file)

      expect(result).toBe(`/mnt/drive${sep}a${sep}b${sep}c${sep}d${sep}e${sep}file.mkv`)
    })

    it('should handle paths with spaces', () => {
      const drive = createDrive('/media/my storage')
      const file = createFile('my movies/my file.mkv')

      const result = getPhysicalPath(drive, file)

      expect(result).toBe(`/media/my storage${sep}my movies${sep}my file.mkv`)
    })

    it('should convert forward slashes in file path to platform separator', () => {
      const drive = createDrive('/data')
      const file = createFile('folder/subfolder/file.txt')

      const result = getPhysicalPath(drive, file)

      // The result should use the platform's separator
      expect(result).toBe(`/data${sep}folder${sep}subfolder${sep}file.txt`)
    })
  })

  describe('getPhysicalParentPath', () => {
    it('should return the parent directory physical path', () => {
      const drive = createDrive('/media/storage')
      const file = createFile('movies/subdir/movie.mkv')

      const result = getPhysicalParentPath(drive, file)

      expect(result).toBe(`/media/storage${sep}movies${sep}subdir`)
    })

    it('should handle file directly in root folder', () => {
      const drive = createDrive('/data')
      const file = createFile('folder/file.txt')

      const result = getPhysicalParentPath(drive, file)

      expect(result).toBe(`/data${sep}folder`)
    })

    it('should handle file at root of drive', () => {
      const drive = createDrive('/data')
      const file = createFile('file.txt')

      const result = getPhysicalParentPath(drive, file)

      // When file is at root, getParentPath returns the filename itself
      expect(result).toBe(`/data${sep}file.txt`)
    })

    it('should handle deeply nested paths', () => {
      const drive = createDrive('/mnt/drive')
      const file = createFile('a/b/c/d/e/file.mkv')

      const result = getPhysicalParentPath(drive, file)

      expect(result).toBe(`/mnt/drive${sep}a${sep}b${sep}c${sep}d${sep}e`)
    })
  })
})
