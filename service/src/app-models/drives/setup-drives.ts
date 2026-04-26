import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import { Drive } from 'common'
import { constants } from 'fs'
import { access, mkdir } from 'fs/promises'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../../authorization/with-role.js'
import { getDefaultDbSettings } from '../../get-default-db-options.js'
import { existsAsync } from '../../utils/exists-async.js'
import { useFileWatchers } from './file-watcher-service.js'

const ensureFolder = async (path: string, mode: number = constants.F_OK) => {
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

export const DriveStore = defineSequelizeStore<Drive, DriveModel, 'letter'>({
  name: 'pi-rat/DriveStore',
  model: Drive,
  sequelizeModel: DriveModel,
  primaryKey: 'letter',
  options: getDefaultDbSettings('drives.sqlite'),
  initModel: async (sequelize) => {
    DriveModel.init(
      {
        letter: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        physicalPath: { type: DataTypes.STRING, unique: true, allowNull: false },
        createdAt: { type: DataTypes.DATE },
        updatedAt: { type: DataTypes.DATE },
      },
      { sequelize },
    )
  },
})

export const DriveDataSet: DataSetToken<Drive, 'letter'> = defineDataSet({
  name: 'pi-rat/DriveDataSet',
  store: DriveStore,
  settings: {
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
        const logger = getLogger(args.injector).withScope('Drives')
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
  },
})

export const setupDrives = async (injector: Injector) => {
  injector.get(DriveDataSet)
  await useFileWatchers(injector)
}
