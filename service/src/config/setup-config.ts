import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { useSequelize } from '@furystack/sequelize-store'
import type { ConfigType } from 'common'
import { Config } from 'common'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../authorization/with-role.js'
import { getDefaultDbSettings } from '../get-default-db-options.js'

class ConfigModel extends Model<Config, Config> implements Config {
  declare id: ConfigType['id']
  declare value: ConfigType['value']
  declare createdAt: Date
  declare updatedAt: Date
}

export const setupConfig = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Config')

  await logger.verbose({ message: '🔧  Setting up Config models and repository' })

  const dbOptions = getDefaultDbSettings('config.sqlite', logger)

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
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
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
      await ConfigModel.sync()
    },
  })

  getRepository(injector).createDataSet(Config, 'id', {
    authorizeGet: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  })

  await logger.verbose({ message: '✅  Config setup completed' })
}
