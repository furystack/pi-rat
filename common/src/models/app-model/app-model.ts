import type { AppModelManifest } from './app-model-manifest.js'
import type { AppState } from './app-state.js'

export interface AppModel {
  manifest: AppModelManifest
  state: AppState
}
