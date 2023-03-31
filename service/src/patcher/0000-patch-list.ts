import { initPatcher } from './0001-init-patcher'
import { addDefaultDashboardPatcher } from './0002-add-default-dashboard'

export const patchList = [initPatcher, addDefaultDashboardPatcher]
