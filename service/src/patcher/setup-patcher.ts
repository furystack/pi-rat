import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { useSequelize } from '@furystack/sequelize-store'
import { PatchRun } from 'common'
import { DataTypes, Model } from 'sequelize'
import { getDefaultDbSettings } from '../get-default-db-options'
import { getRepository } from '@furystack/repository'
import { withRole } from '../authorization/with-role'
import { alwaysDeny } from '../authorization/always-deny'
import { StoreManager } from '@furystack/core'
import { checkForOrphanedPatch } from './check-for-orphaned-patch'
import type { PatchRunStore } from './patch-run-store'
import { patchList } from './0000-patch-list'
import { runPatch } from './run-patch'

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
            unique: true,
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
      await sequelize.sync()
    },
  })

  getRepository(injector).createDataSet(PatchRun, 'id', {
    authorizeAdd: alwaysDeny,
    authorizeGet: withRole('admin'),
    authorizeRemove: alwaysDeny,
    authorizeUpdate: alwaysDeny,
  })

  const patchRunStore = injector.getInstance(StoreManager).getStoreFor(PatchRun, 'id') as PatchRunStore

  await checkForOrphanedPatch(injector, patchRunStore)

  for (const patchInstance of patchList) {
    await runPatch(injector, patchInstance, patchRunStore)
  }

  logger.verbose({ message: '✅  Patches executed' })
}
