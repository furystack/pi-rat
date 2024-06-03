import type { Drive } from '../models/index.js'
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

export const getPhysicalPath = (drive: Drive, file: PiRatFile) => {
  return `${drive.physicalPath}/${file.path}`
}

export const getPhysicalParentPath = (drive: Drive, file: PiRatFile) => {
  return `${drive.physicalPath}/${getParentPath(file)}`
}
