import type { Injector } from '@furystack/inject'
import { getLogger, type LogLevel } from '@furystack/logging'
import { useSequelize } from '@furystack/sequelize-store'
import { LogEntry } from 'common'
import { DataTypes, Model } from 'sequelize'
import { getDefaultDbSettings } from '../../get-default-db-options.js'

class LogEntryModel extends Model<LogEntry, LogEntry> implements LogEntry {
  declare id: string
  declare scope: string
  declare message: string
  declare data?: unknown
  declare level: LogLevel
  declare createdAt: string
}

export const setupLogging = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Logging')

  useSequelize({
    injector,
    model: LogEntry,
    sequelizeModel: LogEntryModel,
    primaryKey: 'id',
    options: getDefaultDbSettings('logging.sqlite', logger),
    initModel: async (sequelize) => {
      LogEntryModel.init(
        {
          id: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          scope: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          message: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          data: {
            type: DataTypes.JSON,
            allowNull: true,
          },
          level: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        {
          sequelize,
          tableName: 'log_entries',
          indexes: [
            {
              fields: ['createdAt'],
            },
            {
              fields: ['createdAt', 'level', 'scope'],
            },
            {
              fields: ['createdAt', 'level'],
            },
            {
              fields: ['createdAt', 'scope'],
            },
          ],
        },
      )
    },
  })
}
