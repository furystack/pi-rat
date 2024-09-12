import type { PiRatFile } from '../models/pirat-file.js'

export const getFileName = (file: PiRatFile) => {
  return file.path.split('/').pop() as string
}

export const getParentPath = (file: PiRatFile) => {
  return file.path.split('/').slice(0, -1).join('/')
}

export const getFullPath = (parentPath: string, fileName: string) => {
  return `${parentPath}/${fileName}`
}
