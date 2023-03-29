import { DataTypes, Model } from 'sequelize'
import { Dashboard } from 'common'
import type { Widget } from 'common'
import { getLogger } from '@furystack/logging'
import type { Injector } from '@furystack/inject'
import { useSequelize } from '@furystack/sequelize-store'
import { getDefaultDbSettings } from '../get-default-db-options'

class DashboardModel extends Model<Dashboard, Dashboard> implements Dashboard {
  declare id: string
  declare name: string
  declare description: string
  declare owner: string
  declare widgets: Widget[]
  declare createdAt: string
  declare updatedAt: string
}

export const setupDashboards = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Dashboards')
  await logger.information({ message: '📔  Setting up Dashboards...' })

  useSequelize({
    injector,
    model: Dashboard,
    sequelizeModel: DashboardModel,
    primaryKey: 'id',
    options: getDefaultDbSettings('dashboards.sqlite', logger),
    initModel: async (sequelize) => {
      DashboardModel.init(
        {
          id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4(),
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
          },
          description: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          owner: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          widgets: {
            type: DataTypes.JSON,
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
          modelName: 'User',
        },
      )
      await sequelize.sync()
    },
  })
}
