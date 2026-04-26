import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import type { ConfigType } from 'common'
import { Config } from 'common'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../../authorization/with-role.js'
import { getDefaultDbSettings } from '../../get-default-db-options.js'

class ConfigModel extends Model<Config, Config> implements Config {
  declare id: ConfigType['id']
  declare value: ConfigType['value']
  declare createdAt: Date
  declare updatedAt: Date
}

const dbOptions = getDefaultDbSettings('config.sqlite')

export const ConfigStore = defineSequelizeStore<Config, ConfigModel, 'id'>({
  name: 'pi-rat/ConfigStore',
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
  },
})

export const ConfigDataSet: DataSetToken<Config, 'id'> = defineDataSet({
  name: 'pi-rat/ConfigDataSet',
  store: ConfigStore,
  settings: {
    authorizeAdd: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeUpdate: withRole('admin'),
    authorizeRemove: withRole('admin'),
  },
})

export const setupConfig = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Config')
  await logger.verbose({ message: 'Initializing config store...' })
  injector.get(ConfigDataSet)
}
