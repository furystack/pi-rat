import type { Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { useSequelize } from '@furystack/sequelize-store'
import { Device, DeviceAwakeHistory, DevicePingHistory } from 'common'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../authorization/with-role.js'
import { getDefaultDbSettings } from '../get-default-db-options.js'

class DeviceModel extends Model<Device, Device> implements Device {
  public declare name: string
  public declare ipAddress: string | undefined
  public declare macAddress: string | undefined
  public declare createdAt: string
  public declare updatedAt: string
}

class DeviceAwakeHistoryModel extends Model<DeviceAwakeHistory, DeviceAwakeHistory> implements DeviceAwakeHistory {
  public declare id: string
  public declare name: string
  public declare createdAt: string
  public declare success: boolean
}

class DevicePingHistoryModel extends Model<DevicePingHistory, DevicePingHistory> implements DevicePingHistory {
  public declare id: string
  public declare name: string
  public declare createdAt: string
  public declare isAvailable: boolean
  public declare ping: number
}

export const setupIotStore = async (injector: Injector, logger: ScopedLogger) => {
  const dbOptions = getDefaultDbSettings('iot.sqlite', logger)
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
      await DeviceModel.sync()
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
      await DeviceAwakeHistoryModel.sync()
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
      await DevicePingHistoryModel.sync()
    },
  })

  const repo = getRepository(injector)

  repo.createDataSet(Device, 'name', {
    authorizeAdd: withRole('admin'),
    authorizeRemove: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeUpdate: withRole('admin'),
  })

  repo.createDataSet(DeviceAwakeHistory, 'id', {
    authorizeAdd: withRole('admin'),
    authorizeRemove: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeUpdate: withRole('admin'),
  })

  repo.createDataSet(DevicePingHistory, 'id', {
    authorizeAdd: withRole('admin'),
    authorizeRemove: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeUpdate: withRole('admin'),
  })
}
