import { Injectable } from '@furystack/inject'
import { CollectionService } from '@furystack/shades-common-components'
import type { DirectoryEntry } from 'common'

@Injectable({ lifetime: 'singleton' })
export class FileListService extends CollectionService<DirectoryEntry> {
  // constructor() {
  //   super({
  //     loader: async () => {
  //       if (!props.currentDriveLetter || !props.currentPath) {
  //         return { count: 0, entries: [] }
  //       }
  //       const up: DirectoryEntry = {
  //         name: '..',
  //         isDirectory: true,
  //         isBlockDevice: false,
  //         isCharacterDevice: false,
  //         isFIFO: false,
  //         isFile: false,
  //         isSocket: false,
  //         isSymbolicLink: false,
  //       }
  //       const result = await drivesService.getFileList(currentDriveLetter, currentPath)
  //       if (currentPath !== '/') {
  //         return { ...result, entries: [up, ...result.entries.sortBy('isDirectory', 'desc')] }
  //       }
  //       return { ...result, entries: result.entries.sortBy('isDirectory', 'desc') }
  //     },
  //     defaultSettings: {},
  //   })
  // }
}
