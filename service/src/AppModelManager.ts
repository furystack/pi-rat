import { defineService, type Injector, type Token } from '@furystack/inject'
import { useScopedLogger } from '@furystack/logging'
import type { AppModel } from 'common'

export interface InternalAppModel extends AppModel {
  setup?: (injector: Injector) => Promise<void>
}

export interface AppModelManager {
  readonly appModels: Map<string, AppModel>
  registerInternalAppModels(injector: Injector, ...appModels: InternalAppModel[]): Promise<void>
}

export const AppModelManager: Token<AppModelManager, 'singleton'> = defineService({
  name: 'pi-rat/AppModelManager',
  lifetime: 'singleton',
  factory: (ctx) => {
    const logger = useScopedLogger(ctx)
    const appModels = new Map<string, AppModel>()

    const updateAppModelState = (appModelId: string, state: AppModel['state']) => {
      const appModel = appModels.get(appModelId)
      if (!appModel) {
        const error = new Error(`App model with id ${appModelId} is not registered`)
        void logger.error({
          message: `Failed to update app model state - app model not registered with id ${appModelId}`,
          data: { error, appModelId, state },
        })
        throw error
      }
      const oldState = appModel.state
      appModel.state = state
      void logger.information({
        message: `App model state for ${appModel.manifest.name} updated from "${oldState.type}" to "${state.type}"`,
        data: { appModel, oldState, state },
      })
    }

    return {
      appModels,
      registerInternalAppModels: async (injector, ...models) => {
        await Promise.all(
          models.map(async (appModel) => {
            if (appModels.has(appModel.manifest.id)) {
              const error = new Error(`App model with id ${appModel.manifest.id} is already registered`)
              await logger.error({
                message: 'Failed to register app model',
                data: { error, appModel },
              })
              throw error
            }
            appModels.set(appModel.manifest.id, appModel)
            await logger.information({
              message: `App model for ${appModel.manifest.name} registered with id ${appModel.manifest.id}`,
              data: { appModel },
            })

            try {
              await appModel.setup?.(injector)
              updateAppModelState(appModel.manifest.id, { type: 'running', lastHealthCheck: new Date() })
            } catch (error) {
              await logger.error({
                message: `Failed to set up app model for ${appModel.manifest.name}`,
                data: { error, appModel },
              })
              updateAppModelState(appModel.manifest.id, { type: 'error', error: (error as Error).message })
            }
          }),
        )
      },
    }
  },
})
