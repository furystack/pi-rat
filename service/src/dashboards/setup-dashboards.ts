import { DataTypes, Model } from 'sequelize'
import { Dashboard } from 'common'
import type { Widget } from 'common'
import { getLogger } from '@furystack/logging'
import type { Injector } from '@furystack/inject'
import { useSequelize } from '@furystack/sequelize-store'
import { getDefaultDbSettings } from '../get-default-db-options.js'
import { getRepository } from '@furystack/repository'
import { withRole } from '../authorization/with-role.js'
import { getCurrentUser } from '@furystack/core'

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
  await logger.verbose({ message: '📔  Setting up Dashboards store and repository...' })

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
            type: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: () => crypto.randomUUID(),
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
        },
      )
      await sequelize.sync()
    },
  })
  await logger.verbose({ message: 'Setting up repository...' })
  getRepository(injector).createDataSet(Dashboard, 'id', {
    authorizeAdd: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeRemove: withRole('admin'),
    authroizeRemoveEntity: async (args) => {
      const currentUser = await getCurrentUser(args.injector)
      if (currentUser?.username === args.entity.owner) {
        return { isAllowed: true }
      }
      return { isAllowed: false, message: 'Not your dashboard!' }
    },
    authorizeUpdate: withRole('admin'),
  })

  await logger.verbose({ message: '✅  Dashboard setup completed' })
}
