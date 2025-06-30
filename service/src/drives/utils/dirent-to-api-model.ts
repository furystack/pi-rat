import type { DirectoryEntry } from 'common'
import type { Dirent } from 'fs'

export const direntToApiModel = (dirent: Dirent): DirectoryEntry => ({
  name: dirent.name,
  isFile: dirent.isFile(),
  isDirectory: dirent.isDirectory(),
  isBlockDevice: dirent.isBlockDevice(),
  isCharacterDevice: dirent.isCharacterDevice(),
  isSymbolicLink: dirent.isSymbolicLink(),
  isFIFO: dirent.isFIFO(),
  isSocket: dirent.isSocket(),
})
