import { describe, it, expect } from 'vitest'
import { getFileName, getParentPath, getFullPath } from './file-utils.js'
import type { PiRatFile } from '../models/pirat-file.js'

describe('file-utils', () => {
  describe('getFileName', () => {
    it('should return the file name from a simple path', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'folder/subfolder/movie.mkv' }
      expect(getFileName(file)).toBe('movie.mkv')
    })

    it('should return the file name from a deeply nested path', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'a/b/c/d/e/file.txt' }
      expect(getFileName(file)).toBe('file.txt')
    })

    it('should return the file name when path has no directories', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'document.pdf' }
      expect(getFileName(file)).toBe('document.pdf')
    })

    it('should handle paths with special characters in file name', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'folder/file with spaces.txt' }
      expect(getFileName(file)).toBe('file with spaces.txt')
    })

    it('should handle paths with dots in folder names', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'folder.v2/subfolder.test/file.mkv' }
      expect(getFileName(file)).toBe('file.mkv')
    })
  })

  describe('getParentPath', () => {
    it('should return the parent path from a simple path', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'folder/subfolder/movie.mkv' }
      expect(getParentPath(file)).toBe('folder/subfolder')
    })

    it('should return the parent path from a deeply nested path', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'a/b/c/d/e/file.txt' }
      expect(getParentPath(file)).toBe('a/b/c/d/e')
    })

    it('should return the file name when path has no parent directory', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'document.pdf' }
      // PathHelper.getParentPath returns the path itself when there's no parent
      expect(getParentPath(file)).toBe('document.pdf')
    })

    it('should handle paths with special characters', () => {
      const file: PiRatFile = { driveLetter: 'A', path: 'folder with spaces/file.txt' }
      expect(getParentPath(file)).toBe('folder with spaces')
    })
  })

  describe('getFullPath', () => {
    it('should combine parent path and file name', () => {
      expect(getFullPath('folder/subfolder', 'movie.mkv')).toBe('folder/subfolder/movie.mkv')
    })

    it('should handle empty parent path', () => {
      expect(getFullPath('', 'document.pdf')).toBe('document.pdf')
    })

    it('should normalize paths with trailing slashes', () => {
      expect(getFullPath('folder/', 'file.txt')).toBe('folder/file.txt')
    })

    it('should handle paths with special characters', () => {
      expect(getFullPath('folder with spaces', 'file name.txt')).toBe('folder with spaces/file name.txt')
    })

    it('should normalize paths with double slashes', () => {
      const result = getFullPath('folder', '/file.txt')
      expect(result).toBe('folder/file.txt')
    })
  })
})
