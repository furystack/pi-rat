import { initPatcher } from './0001-init-patcher.js'
import { addDefaultDashboardPatcher } from './0002-add-default-dashboard.js'
import { movieFileIdInWatchProgress } from './0003-movieFileId-in-watch-entry.js'

export const patchList = [initPatcher, addDefaultDashboardPatcher, movieFileIdInWatchProgress]
