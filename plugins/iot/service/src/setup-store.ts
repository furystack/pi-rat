import type { Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import type { AuthorizationResult } from '@furystack/repository'
import { useSequelize } from '@furystack/sequelize-store'
import { Device, DeviceAwakeHistory, DevicePingHistory } from '@pi-rat/iot-common'
import { DataTypes, Model, type Options } from 'sequelize'

class DeviceModel extends Model<Device, Device> implements Device {
  declare public name: string
  declare public ipAddress: string | undefined
  declare public macAddress: string | undefined
  declare public createdAt: string
  declare public updatedAt: string
}

class DeviceAwakeHistoryModel extends Model<DeviceAwakeHistory, DeviceAwakeHistory> implements DeviceAwakeHistory {
  declare public id: string
  declare public name: string
  declare public createdAt: string
  declare public success: boolean
}

class DevicePingHistoryModel extends Model<DevicePingHistory, DevicePingHistory> implements DevicePingHistory {
  declare public id: string
  declare public name: string
  declare public createdAt: string
  declare public isAvailable: boolean
  declare public ping: number
}

import type { Roles } from 'common'

export type IotStoreSetupOptions = {
  getDbSettings: (fileName: string, logger: ScopedLogger) => Options
  withRole: (...roles: Roles) => (options: { injector: Injector }) => Promise<AuthorizationResult>
}

export const setupIotStore = async (injector: Injector, options: IotStoreSetupOptions) => {
  const logger = getLogger(injector).withScope('IOT')

  const dbOptions = options.getDbSettings('iot.sqlite', logger)
  useSequelize({
    injector,
    model: Device,
    options: dbOptions,
    primaryKey: 'name',
    sequelizeModel: DeviceModel,
    initModel: async (sequelize) => {
      DeviceModel.init(
        {
          name: {
            type: DataTypes.STRING,
            primaryKey: true,
            references: {
              model: DeviceModel,
              key: 'name',
            },
          },
          ipAddress: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
          },
          macAddress: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        {
          sequelize,
        },
      )
    },
  })

  useSequelize({
    injector,
    model: DeviceAwakeHistory,
    options: dbOptions,
    primaryKey: 'id',
    sequelizeModel: DeviceAwakeHistoryModel,
    initModel: async (sequelize) => {
      DeviceAwakeHistoryModel.init(
        {
          id: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          success: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
          },
        },
        {
          sequelize,
        },
      )
    },
  })

  useSequelize({
    injector,
    model: DevicePingHistory,
    options: dbOptions,
    primaryKey: 'id',
    sequelizeModel: DevicePingHistoryModel,
    initModel: async (sequelize) => {
      DevicePingHistoryModel.init(
        {
          id: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          isAvailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
          },
          ping: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
        },
        {
          sequelize,
        },
      )
    },
  })

  const repo = getRepository(injector)

  repo.createDataSet(Device, 'name', {
    authorizeAdd: options.withRole('admin'),
    authorizeRemove: options.withRole('admin'),
    authorizeGet: options.withRole('admin'),
    authorizeUpdate: options.withRole('admin'),
  })

  repo.createDataSet(DeviceAwakeHistory, 'id', {
    authorizeAdd: options.withRole('admin'),
    authorizeRemove: options.withRole('admin'),
    authorizeGet: options.withRole('admin'),
    authorizeUpdate: options.withRole('admin'),
  })

  repo.createDataSet(DevicePingHistory, 'id', {
    authorizeAdd: options.withRole('admin'),
    authorizeRemove: options.withRole('admin'),
    authorizeGet: options.withRole('admin'),
    authorizeUpdate: options.withRole('admin'),
  })
}
