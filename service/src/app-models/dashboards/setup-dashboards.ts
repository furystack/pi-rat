import { getCurrentUser } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import type { Widget } from 'common'
import { Dashboard } from 'common'
import { DataTypes, Model } from 'sequelize'
import { withRole } from '../../authorization/with-role.js'
import { getDefaultDbSettings } from '../../get-default-db-options.js'

class DashboardModel extends Model<Dashboard, Dashboard> implements Dashboard {
  declare id: string
  declare name: string
  declare description: string
  declare owner: string
  declare widgets: Widget[]
  declare createdAt: string
  declare updatedAt: string
}

export const DashboardStore = defineSequelizeStore<Dashboard, DashboardModel, 'id'>({
  name: 'pi-rat/DashboardStore',
  model: Dashboard,
  sequelizeModel: DashboardModel,
  primaryKey: 'id',
  options: getDefaultDbSettings('dashboards.sqlite'),
  initModel: async (sequelize) => {
    DashboardModel.init(
      {
        id: {
          type: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          defaultValue: () => crypto.randomUUID(),
        },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        description: { type: DataTypes.STRING, allowNull: true },
        owner: { type: DataTypes.STRING, allowNull: false },
        widgets: { type: DataTypes.JSON, allowNull: false },
        createdAt: { type: DataTypes.DATE },
        updatedAt: { type: DataTypes.DATE },
      },
      { sequelize },
    )
  },
})

export const DashboardDataSet: DataSetToken<Dashboard, 'id'> = defineDataSet({
  name: 'pi-rat/DashboardDataSet',
  store: DashboardStore,
  settings: {
    authorizeAdd: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeRemove: withRole('admin'),
    authorizeRemoveEntity: async (args) => {
      const currentUser = await getCurrentUser(args.injector)
      if (currentUser?.username === args.entity.owner) {
        return { isAllowed: true }
      }
      return { isAllowed: false, message: 'Not your dashboard!' }
    },
    authorizeUpdate: withRole('admin'),
  },
})

export const setupDashboards = async (injector: Injector) => {
  injector.get(DashboardDataSet)
}
