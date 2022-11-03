import { useSequelize } from '@furystack/sequelize-store'
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
import { Model, DataTypes } from 'sequelize'

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

class DriveModel extends Model<Drive, Drive> implements Drive {
  physicalPath!: string
  letter!: string
}

export const setupDrives = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('setupDrives')
  logger.information({ message: '📁  Setting up drives...' })

  useSequelize({
    injector,
    model: Drive,
    sequelizeModel: DriveModel,
    primaryKey: 'letter',
    options: {
      dialect: 'sqlite',
      storage: join(getDataFolder(), 'drives.sqlite'),
    },
    initModel: async (sequelize) => {
      DriveModel.init(
        {
          letter: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          physicalPath: {
            type: DataTypes.STRING,
          },
        },
        {
          sequelize,
          modelName: 'Drive',
        },
      )
      await sequelize.sync()
    },
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
