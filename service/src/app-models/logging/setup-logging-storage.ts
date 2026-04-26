import type { Injector } from '@furystack/inject'
import type { LogLevel } from '@furystack/logging'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import { LogEntry } from 'common'
import { DataTypes, Model } from 'sequelize'
import { alwaysDeny } from '../../authorization/always-deny.js'
import { withRole } from '../../authorization/with-role.js'
import { getDefaultDbSettings } from '../../get-default-db-options.js'

class LogEntryModel extends Model<LogEntry, LogEntry> implements LogEntry {
  declare id: string
  declare scope: string
  declare message: string
  declare data?: unknown
  declare level: LogLevel
  declare createdAt: string
}

export const LogEntryStore = defineSequelizeStore<LogEntry, LogEntryModel, 'id'>({
  name: 'pi-rat/LogEntryStore',
  model: LogEntry,
  sequelizeModel: LogEntryModel,
  primaryKey: 'id',
  options: getDefaultDbSettings('logging.sqlite'),
  initModel: async (sequelize) => {
    LogEntryModel.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true },
        scope: { type: DataTypes.STRING, allowNull: false },
        message: { type: DataTypes.STRING, allowNull: false },
        data: { type: DataTypes.JSON, allowNull: true },
        level: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
      },
      {
        sequelize,
        tableName: 'log_entries',
        indexes: [
          { fields: ['createdAt'] },
          { fields: ['createdAt', 'level', 'scope'] },
          { fields: ['createdAt', 'level'] },
          { fields: ['createdAt', 'scope'] },
        ],
      },
    )
  },
})

export const LogEntryDataSet: DataSetToken<LogEntry, 'id'> = defineDataSet({
  name: 'pi-rat/LogEntryDataSet',
  store: LogEntryStore,
  settings: {
    authorizeGet: withRole('admin'),
    authorizeUpdate: alwaysDeny,
    authorizeRemove: alwaysDeny,
    authorizeAdd: withRole('admin'),
  },
})

export const setupLoggingStorage = async (injector: Injector): Promise<void> => {
  // Resolve the dataset to ensure the underlying store and Sequelize model are wired up
  injector.get(LogEntryDataSet)
}
