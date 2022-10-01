import { useFileSystemStore } from '@furystack/filesystem-store'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { access, mkdir } from 'fs/promises'
import { constants } from 'fs'
import { Drive } from 'common'
import { join } from 'path'
import { authorizedOnly } from '../authorized-only'
import { setupDrivesRestApi } from './setup-drives-rest-api'
import { getDataFolder } from '../get-data-folder'

export const existsAsync = async (path: string, mode?: number) => {
  try {
    await access(path, mode)
  } catch {
    return false
  }
  return true
}

const ensureFolder = async (path: string, mode: number = constants.W_OK) => {
  const exists = await existsAsync(path, mode)
  if (!exists) {
    await mkdir(path, { recursive: true })
    await access(path, mode)
  }
}

export const setupDrives = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('setupDrives')
  logger.information({ message: '📁  Setting up drives...' })

  useFileSystemStore({
    injector,
    model: Drive,
    primaryKey: 'letter',
    fileName: join(getDataFolder(), 'drives.json'),
  })

  getRepository(injector).createDataSet(Drive, 'letter', {
    authorizeGet: authorizedOnly,
    authorizeUpdate: authorizedOnly,
    authorizeRemove: authorizedOnly,
    authorizeAdd: async (args) => {
      const isAuthorized = await authorizedOnly(args)
      if (isAuthorized?.isAllowed === false) {
        return isAuthorized
      }

      try {
        await ensureFolder(args.entity.physicalPath as string)
      } catch (error) {
        /** */
        return {
          isAllowed: false,
          message: `Could not access the physical path: ${args.entity.physicalPath}`,
        }
      }

      return { isAllowed: true }
    },
  })

  await setupDrivesRestApi(injector)

  logger.information({ message: '✅  Drives has been set up' })
}
