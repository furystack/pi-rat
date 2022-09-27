import { useFileSystemStore } from '@furystack/filesystem-store'
import { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { Drive } from 'common'
import { authorizedDataSet } from './authorized-data-set'

export const setupDrives = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('setupDrives')
  logger.information({ message: '📁  Setting up drives...' })

  useFileSystemStore({
    injector,
    model: Drive,
    primaryKey: 'letter',
    fileName: '',
  })

  getRepository(injector).createDataSet(Drive, 'letter', {
    ...authorizedDataSet,
  })

  logger.information({ message: '✅  Drives has been set up' })
}
