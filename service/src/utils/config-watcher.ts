import type { Injector } from '@furystack/inject'
import type { ScopedLogger } from '@furystack/logging'
import type { DataSet } from '@furystack/repository'
import type { ConfigType } from 'common'
import type { Config } from 'common'

export type ConfigWatcherOptions<TConfig extends ConfigType> = {
  configDataSet: DataSet<Config, 'id'>
  systemInjector: Injector
  logger: ScopedLogger
  configId: TConfig['id']
  serviceName: string
  onChange: (config: TConfig | undefined) => void
}

export type ConfigWatcher = {
  init: () => Promise<void>
  dispose: () => void
}

/**
 * The DataSet stores `Config` objects (with `createdAt`/`updatedAt`) but individual
 * config interfaces (`OmdbConfig`, `TmdbConfig`, etc.) only define `id` and `value`.
 * This helper narrows a loaded `Config` to the caller's expected `TConfig` shape.
 *
 * The caller guarantees the correct `TConfig` by filtering on `configId`, so the
 * assertion is safe at runtime even though TypeScript cannot statically verify the
 * id-value pairing within the `ConfigType` union.
 */
const narrowConfig = <TConfig extends ConfigType>(raw: Pick<Config, 'id' | 'value'>): TConfig =>
  ({ id: raw.id, value: raw.value }) as TConfig

export const createConfigWatcher = <TConfig extends ConfigType>(
  options: ConfigWatcherOptions<TConfig>,
): ConfigWatcher => {
  let subscriptions: Disposable[] = []
  let currentConfig: TConfig | undefined

  const init = async () => {
    for (const sub of subscriptions) {
      sub[Symbol.dispose]()
    }
    subscriptions = []

    const loaded = await options.configDataSet.get(options.systemInjector, options.configId)
    currentConfig = loaded ? narrowConfig<TConfig>(loaded) : undefined
    options.onChange(currentConfig)

    if (currentConfig) {
      await options.logger.verbose({ message: `✅   ${options.serviceName} initialized` })
    } else {
      await options.logger.information({
        message: `🚫   No config found, ${options.serviceName} will not be initialized`,
      })
    }

    subscriptions.push(
      options.configDataSet.subscribe('onEntityAdded', ({ entity }) => {
        if (entity.id === options.configId) {
          currentConfig = narrowConfig<TConfig>(entity)
          options.onChange(currentConfig)
          void options.logger.information({ message: `🎬   ${options.serviceName} config added` })
        }
      }),
      options.configDataSet.subscribe('onEntityUpdated', ({ change }) => {
        if (change.id === options.configId) {
          const mergedValue = change.value ?? currentConfig?.value
          if (mergedValue == null) {
            currentConfig = undefined
            options.onChange(undefined)
          } else {
            currentConfig = narrowConfig<TConfig>({ id: change.id, value: mergedValue })
            options.onChange(currentConfig)
          }
          void options.logger.information({
            message: `🎬   ${options.serviceName} config updated`,
            data: change,
          })
        }
      }),
      options.configDataSet.subscribe('onEntityRemoved', ({ key }) => {
        if (key === options.configId) {
          currentConfig = undefined
          options.onChange(undefined)
          void options.logger.information({
            message: `🚫   ${options.serviceName} config removed`,
          })
        }
      }),
    )
  }

  const dispose = () => {
    for (const sub of subscriptions) {
      sub[Symbol.dispose]()
    }
    subscriptions = []
  }

  return { init, dispose }
}
