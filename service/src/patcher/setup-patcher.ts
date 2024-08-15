import { StoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { useSequelize } from '@furystack/sequelize-store'
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

export const setupPatcher = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('Patcher')
  await logger.verbose({ message: '🩹  Initializing Patcher...' })

  useSequelize({
    injector,
    model: PatchRun,
    sequelizeModel: PatchModel,
    primaryKey: 'id',
    options: getDefaultDbSettings('patcher.sqlite', logger),
    initModel: async (sequelize) => {
      PatchModel.init(
        {
          id: {
            type: DataTypes.UUIDV4,
            primaryKey: true,
            defaultValue: () => crypto.randomUUID(),
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          description: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          patchId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          status: {
            type: DataTypes.ENUM('orphaned', 'running', 'success', 'failed'),
            allowNull: false,
            defaultValue: 'running',
          },
          createdAt: {
            type: DataTypes.DATE,
          },
          updatedAt: {
            type: DataTypes.DATE,
          },
          log: {
            type: DataTypes.JSON,
          },
        },
        {
          indexes: [
            {
              fields: ['patchId'],
            },
            {
              fields: ['status'],
            },
          ],
          sequelize,
        },
      )
      await PatchModel.sync()
    },
  })

  getRepository(injector).createDataSet(PatchRun, 'id', {
    authorizeAdd: alwaysDeny,
    authorizeGet: withRole('admin'),
    authorizeRemove: alwaysDeny,
    authorizeUpdate: alwaysDeny,
  })

  const patchRunStore = injector.getInstance(StoreManager).getStoreFor(PatchRun, 'id')

  await checkForOrphanedPatch(injector, patchRunStore)

  for (const patchInstance of patchList) {
    await runPatch(injector, patchInstance, patchRunStore)
  }

  await logger.verbose({ message: '✅  Patches executed' })
}
