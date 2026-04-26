import { createInMemoryCacheStore, createSyncHooks, defineEntitySyncService } from '@furystack/entity-sync-client'
import { environmentOptions } from '../utils/environment-options.js'

const syncWsUrl = new URL(`${environmentOptions.serviceUrl}/sync`, window.location.href)
  .toString()
  .replace('http', 'ws')

export const AppEntitySync = defineEntitySyncService({
  wsUrl: syncWsUrl,
  localStore: createInMemoryCacheStore(),
})

export const { useEntitySync, useCollectionSync } = createSyncHooks(AppEntitySync)
