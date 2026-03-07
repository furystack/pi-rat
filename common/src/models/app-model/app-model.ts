import type { AppModelManifest } from './app-model-manifest.js'
import type { AppState } from './app-state.js'

export interface AppModel {
  manifest: AppModelManifest
  state: AppState
}

export type EntitySyncModelConfig = {
  model: new (...args: unknown[]) => object
  primaryKey: string
  debounceMs?: number
}

export interface InternalAppModel extends AppModel {
  setup?: () => Promise<void>
  getEntitySyncModels?: () => EntitySyncModelConfig[]
}
