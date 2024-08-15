import type { Drive, PiRatFile } from 'common'
import { getParentPath } from 'common'
import { sep } from 'path'

export const getPhysicalPath = (drive: Drive, file: PiRatFile) => {
  return `${drive.physicalPath}${sep}${file.path.split('/').join(sep)}`
}

export const getPhysicalParentPath = (drive: Drive, file: PiRatFile) => {
  return `${drive.physicalPath}${sep}${getParentPath(file).split('/').join(sep)}`
}
