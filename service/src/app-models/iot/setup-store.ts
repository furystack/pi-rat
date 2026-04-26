import type { Injector } from '@furystack/inject'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import { Device, DeviceAwakeHistory, DevicePingHistory } from 'common'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../../authorization/with-role.js'
import { getDefaultDbSettings } from '../../get-default-db-options.js'

class DeviceModel extends Model<Device, Device> implements Device {
  declare name: string
  declare ipAddress: string | undefined
  declare macAddress: string | undefined
  declare createdAt: string
  declare updatedAt: string
}

class DeviceAwakeHistoryModel extends Model<DeviceAwakeHistory, DeviceAwakeHistory> implements DeviceAwakeHistory {
  declare id: string
  declare name: string
  declare createdAt: string
  declare success: boolean
}

class DevicePingHistoryModel extends Model<DevicePingHistory, DevicePingHistory> implements DevicePingHistory {
  declare id: string
  declare name: string
  declare createdAt: string
  declare isAvailable: boolean
  declare ping: number
}

const dbOptions = getDefaultDbSettings('iot.sqlite')

export const DeviceStore = defineSequelizeStore<Device, DeviceModel, 'name'>({
  name: 'pi-rat/DeviceStore',
  model: Device,
  sequelizeModel: DeviceModel,
  primaryKey: 'name',
  options: dbOptions,
  initModel: async (sequelize) => {
    DeviceModel.init(
      {
        name: { type: DataTypes.STRING, primaryKey: true, references: { model: DeviceModel, key: 'name' } },
        ipAddress: { type: DataTypes.STRING, allowNull: true, unique: true },
        macAddress: { type: DataTypes.STRING, allowNull: true, unique: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
      },
      { sequelize },
    )
  },
})

export const DeviceAwakeHistoryStore = defineSequelizeStore<DeviceAwakeHistory, DeviceAwakeHistoryModel, 'id'>({
  name: 'pi-rat/DeviceAwakeHistoryStore',
  model: DeviceAwakeHistory,
  sequelizeModel: DeviceAwakeHistoryModel,
  primaryKey: 'id',
  options: dbOptions,
  initModel: async (sequelize) => {
    DeviceAwakeHistoryModel.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        success: { type: DataTypes.BOOLEAN, allowNull: false },
      },
      { sequelize },
    )
  },
})

export const DevicePingHistoryStore = defineSequelizeStore<DevicePingHistory, DevicePingHistoryModel, 'id'>({
  name: 'pi-rat/DevicePingHistoryStore',
  model: DevicePingHistory,
  sequelizeModel: DevicePingHistoryModel,
  primaryKey: 'id',
  options: dbOptions,
  initModel: async (sequelize) => {
    DevicePingHistoryModel.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        isAvailable: { type: DataTypes.BOOLEAN, allowNull: false },
        ping: { type: DataTypes.INTEGER, allowNull: true },
      },
      { sequelize },
    )
  },
})

const adminAuth = {
  authorizeAdd: withRole('admin'),
  authorizeRemove: withRole('admin'),
  authorizeGet: withRole('admin'),
  authorizeUpdate: withRole('admin'),
}

export const DeviceDataSet: DataSetToken<Device, 'name'> = defineDataSet({
  name: 'pi-rat/DeviceDataSet',
  store: DeviceStore,
  settings: adminAuth,
})

export const DeviceAwakeHistoryDataSet: DataSetToken<DeviceAwakeHistory, 'id'> = defineDataSet({
  name: 'pi-rat/DeviceAwakeHistoryDataSet',
  store: DeviceAwakeHistoryStore,
  settings: adminAuth,
})

export const DevicePingHistoryDataSet: DataSetToken<DevicePingHistory, 'id'> = defineDataSet({
  name: 'pi-rat/DevicePingHistoryDataSet',
  store: DevicePingHistoryStore,
  settings: adminAuth,
})

export const setupIotStore = async (injector: Injector) => {
  injector.get(DeviceDataSet)
  injector.get(DeviceAwakeHistoryDataSet)
  injector.get(DevicePingHistoryDataSet)
}
