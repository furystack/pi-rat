import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { useSequelize } from '@furystack/sequelize-store'
import { Drive } from 'common'
import { constants } from 'fs'
import { access, mkdir } from 'fs/promises'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../authorization/with-role.js'
import { getDefaultDbSettings } from '../get-default-db-options.js'
import { existsAsync } from '../utils/exists-async.js'
import { useFileWatchers } from './file-watcher-service.js'

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
  await logger.verbose({ message: '📁  Setting up drives store and repository...' })

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
            allowNull: false,
          },
          physicalPath: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
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
        },
      )
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
        await ensureFolder(args.entity.physicalPath)
      } catch (error) {
        await logger.warning({
          message: `Failed to create folder in path ${args.entity.physicalPath}`,
          data: { error },
        })
        return {
          isAllowed: false,
          message: `Could not access the physical path: ${args.entity.physicalPath}`,
        }
      }

      return { isAllowed: true }
    },
  })

  await logger.verbose({ message: '💾  Setting up FileWatchers...' })
  await useFileWatchers(injector)

  await logger.verbose({ message: '✅  Drives store and repository has been set up' })
}
