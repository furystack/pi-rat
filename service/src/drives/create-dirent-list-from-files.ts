import type { DirectoryEntry } from 'common'
import type { File, Files } from 'formidable'

export const createDirentListFromFiles = (files: Files): DirectoryEntry[] => {
  const fileArray = Object.values(files).flatMap((value) => value) as File[]
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
