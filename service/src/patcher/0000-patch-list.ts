import { initPatcher } from './0001-init-patcher.js'
import { addDefaultDashboardPatcher } from './0002-add-default-dashboard.js'

export const patchList = [initPatcher, addDefaultDashboardPatcher]
