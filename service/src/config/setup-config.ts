import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { useSequelize } from '@furystack/sequelize-store'
import { Config } from 'common'
import type { ConfigType } from 'common'
import { DataTypes, Model } from 'sequelize'
import { getDefaultDbSettings } from '../get-default-db-options'
import { getRepository } from '@furystack/repository'
import { withRole } from '../authorization/with-role'

class ConfigModel extends Model<Config, Config> implements Config {
  declare id: string
  declare value: ConfigType
  declare createdAt: Date
  declare updatedAt: Date
}

export const setupConfig = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Config')

  logger.verbose({ message: '🔧  Setting up Config models and repository' })

  const dbOptions = getDefaultDbSettings('config', logger)

  useSequelize({
    injector,
    model: Config,
    sequelizeModel: ConfigModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      ConfigModel.init(
        {
          id: {
            type: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: crypto.randomUUID(),
          },
          value: {
            type: DataTypes.JSON,
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
        { sequelize },
      )
      await sequelize.sync()
    },
  })

  getRepository(injector).createDataSet(Config, 'id', {
    authorizeGet: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  logger.verbose({ message: '✅  Config setup completed' })
}
