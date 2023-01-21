import type { DirectoryEntry } from 'common/src/models/directory-entry'
import type { File, Files } from 'formidable'

export const createDirentListFromFiles = (files: Files): DirectoryEntry[] => {
  const fileArray: File[] = Object.values(files).flatMap((value) => value)
  return fileArray.map((file) => ({
    name: file.newFilename,
    isFile: true,
    isDirectory: false,
    isBlockDevice: false,
    isCharacterDevice: false,
    isSymbolicLink: false,
    isFIFO: false,
    isSocket: false,
  }))
}
