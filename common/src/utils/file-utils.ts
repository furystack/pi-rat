import { PathHelper } from '@furystack/utils'
import type { PiRatFile } from '../models/pirat-file.js'

export const getFileName = (file: PiRatFile) => {
  return PathHelper.getSegments(file.path).pop() as string
}

export const getParentPath = (file: PiRatFile) => {
  return PathHelper.getParentPath(file.path)
}

export const getFullPath = (parentPath: string, fileName: string) => {
  return PathHelper.normalize(`${parentPath}/${fileName}`)
}
