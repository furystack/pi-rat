import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineDataSet, getDataSetFor, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import { PatchRun } from 'common'
import { DataTypes, Model } from 'sequelize'
import { alwaysDeny } from '../authorization/always-deny.js'
import { withRole } from '../authorization/with-role.js'
import { getDefaultDbSettings } from '../get-default-db-options.js'
import { patchList } from './0000-patch-list.js'
import { checkForOrphanedPatch } from './check-for-orphaned-patch.js'
import { runPatch } from './run-patch.js'

class PatchModel extends Model<PatchRun, PatchRun> implements PatchRun {
  declare id: string
  declare createdAt: Date
  declare patchId: string
  declare name: string
  declare description: string
  declare status: 'orphaned' | 'running' | 'success' | 'failed'
  declare updatedAt: Date
  declare log: Array<{ timestamp: string; message: string }>
}

export const PatchRunStore = defineSequelizeStore<PatchRun, PatchModel, 'id'>({
  name: 'pi-rat/PatchRunStore',
  model: PatchRun,
  sequelizeModel: PatchModel,
  primaryKey: 'id',
  options: getDefaultDbSettings('patcher.sqlite'),
  initModel: async (sequelize) => {
    PatchModel.init(
      {
        id: { type: DataTypes.UUIDV4, primaryKey: true, defaultValue: () => crypto.randomUUID() },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: true },
        patchId: { type: DataTypes.STRING, allowNull: false },
        status: {
          type: DataTypes.ENUM('orphaned', 'running', 'success', 'failed'),
          allowNull: false,
          defaultValue: 'running',
        },
        createdAt: { type: DataTypes.DATE },
        updatedAt: { type: DataTypes.DATE },
        log: { type: DataTypes.JSON },
      },
      {
        indexes: [{ fields: ['patchId'] }, { fields: ['status'] }],
        sequelize,
      },
    )
  },
})

export const PatchRunDataSet: DataSetToken<PatchRun, 'id'> = defineDataSet({
  name: 'pi-rat/PatchRunDataSet',
  store: PatchRunStore,
  settings: {
    authorizeAdd: withRole('admin'),
    authorizeGet: withRole('admin'),
    authorizeRemove: alwaysDeny,
    authorizeUpdate: withRole('admin'),
  },
})

export const setupPatcher = async (injector: Injector) => {
  const systemInjector = useSystemIdentityContext({ injector, username: 'patcher' })
  try {
    const patchRunDataSet = getDataSetFor(injector, PatchRunDataSet)

    await checkForOrphanedPatch(systemInjector, patchRunDataSet)

    for (const patchInstance of patchList) {
      await runPatch(systemInjector, patchInstance, patchRunDataSet)
    }
  } finally {
    await systemInjector[Symbol.asyncDispose]()
  }
}
