import { useEntitySync } from '@furystack/entity-sync-service'
import type { InternalAppModel } from '../../AppModelManager.js'
import { LoggingManifest } from './logging-manifest.js'
import { setupLoggerInstance } from './setup-logger-instance.js'
import { setupLoggingRestApi } from './setup-logging-rest-api.js'
import { LogEntryDataSet, setupLoggingStorage } from './setup-logging-storage.js'

export const LoggingAppModel: InternalAppModel = {
  manifest: LoggingManifest,
  state: { type: 'initializing' },
  setup: async (injector) => {
    await setupLoggingStorage(injector)
    await setupLoggerInstance(injector)
    useEntitySync(injector, {
      models: [
        {
          dataSet: LogEntryDataSet as unknown as Parameters<typeof useEntitySync>[1]['models'][number]['dataSet'],
          debounceMs: 200,
        },
      ],
    })
    await setupLoggingRestApi(injector)
  },
}
