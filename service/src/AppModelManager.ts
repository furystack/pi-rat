import { Injectable, Injected } from '@furystack/inject'
import { getLogger, type ScopedLogger } from '@furystack/logging'
import type { AppModel } from 'common'

export interface InternalAppModel extends AppModel {
  setup?: () => Promise<void>
}

@Injectable({ lifetime: 'singleton' })
export class AppModelManager {
  public appModels = new Map<string, AppModel>()

  @Injected((injector) => getLogger(injector).withScope(AppModelManager.name))
  declare private readonly logger: ScopedLogger

  public async registerInternalAppModels(...appModels: InternalAppModel[]) {
    await Promise.all(
      appModels.map(async (appModel) => {
        if (this.appModels.has(appModel.manifest.id)) {
          const error = new Error(`App model with id ${appModel.manifest.id} is already registered`)
          await this.logger.error({
            message: 'Failed to register app model',
            data: {
              error,
              appModel,
            },
          })
          throw error
        }
        this.appModels.set(appModel.manifest.id, appModel)
        await this.logger.information({
          message: `App model for ${appModel.manifest.name} registered with id ${appModel.manifest.id}`,
          data: { appModel },
        })

        try {
          await appModel.setup?.()
          this.updateAppModelState(appModel.manifest.id, { type: 'running', lastHealthCheck: new Date() })
        } catch (error) {
          await this.logger.error({
            message: `Failed to set up app model for ${appModel.manifest.name}`,
            data: {
              error,
              appModel,
            },
          })
          this.updateAppModelState(appModel.manifest.id, { type: 'error', error: (error as Error).message })
        }
      }),
    )
  }

  public updateAppModelState(appModelId: string, state: AppModel['state']) {
    const appModel = this.appModels.get(appModelId)
    if (!appModel) {
      const error = new Error(`App model with id ${appModelId} is not registered`)
      void this.logger.error({
        message: `Failed to update app model state - app model not registered with id ${appModelId}`,
        data: {
          error,
          appModelId,
          state,
        },
      })
      throw error
    }
    const oldStateType = appModel.state.type
    appModel.state = state
    void this.logger.information({
      message: `App model state for ${appModel.manifest.name} updated from "${oldStateType}" to "${state.type}"`,
      data: { appModel, state },
    })
  }
}
