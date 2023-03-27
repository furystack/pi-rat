import { useSequelize } from '@furystack/sequelize-store'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { access, mkdir } from 'fs/promises'
import { constants } from 'fs'
import { Drive } from 'common'
import { setupDrivesRestApi } from './setup-drives-rest-api'
import { Model, DataTypes } from 'sequelize'
import { getDefaultDbSettings } from '../get-default-db-options'
import { useFileWatchers } from './file-watcher-service'
import { withRole } from '../with-role'

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
  declare physicalPath: string
  declare letter: string
  declare createdAt: string
  declare updatedAt: string
}

export const setupDrives = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Drives')
  await logger.information({ message: '📁  Setting up drives...' })

  useSequelize({
    injector,
    model: Drive,
    sequelizeModel: DriveModel,
    primaryKey: 'letter',
    options: getDefaultDbSettings('drives.sqlite', logger),
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
          createdAt: {
            type: DataTypes.DATE,
          },
          updatedAt: {
            type: DataTypes.DATE,
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

  await logger.verbose({ message: 'Setting up repository...' })
  getRepository(injector).createDataSet(Drive, 'letter', {
    authorizeGet: withRole('admin'),
    authorizeUpdate: async (args) => {
      const internalFields = ['createdAt', 'updatedAt', 'letter']

      const isAuthorized = await withRole('admin')(args)
      if (isAuthorized?.isAllowed === false) {
        return isAuthorized
      }

      if (Object.keys(args.change).some((key) => internalFields.includes(key))) {
        return {
          isAllowed: false,
          message: `You are not allowed to change the following properties: ${internalFields.join(', ')}`,
        }
      }

      return { isAllowed: true }
    },
    authorizeRemove: withRole('admin'),
    authorizeAdd: async (args) => {
      const isAuthorized = await withRole('admin')(args)
      if (isAuthorized?.isAllowed === false) {
        return isAuthorized
      }

      try {
        await ensureFolder(args.entity.physicalPath as string)
      } catch (error) {
        logger.warning({ message: `Failed to create folder in path ${args.entity.physicalPath}`, data: { error } })
        return {
          isAllowed: false,
          message: `Could not access the physical path: ${args.entity.physicalPath}`,
        }
      }

      return { isAllowed: true }
    },
  })

  await logger.verbose({ message: 'Setting up REST API...' })
  await setupDrivesRestApi(injector)

  await logger.verbose({ message: '💾  Setting up FileWatchers...' })
  await useFileWatchers(injector)

  await logger.information({ message: '✅  Drives has been set up' })
}
