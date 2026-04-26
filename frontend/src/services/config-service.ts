import { Cache } from '@furystack/cache'
import type { FindOptions } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { ResponseError } from '@furystack/rest-client-fetch'
import type { Config, ConfigType } from 'common'
import { ConfigApiClient } from './api-clients/config-api-client.js'

class ConfigServiceImpl implements Disposable {
  public configCache = new Cache({
    capacity: 50,
    load: async (id: ConfigType['id']) => {
      try {
        const { result } = await this.configApiClient.call({
          method: 'GET',
          action: '/config/:id',
          url: { id },
          query: {},
        })
        return result
      } catch (error) {
        if (error instanceof ResponseError && error.response.status === 404) {
          return { id, value: null } as unknown as Config
        }
        throw error
      }
    },
  })

  private configsQueryCache = new Cache({
    capacity: 10,
    load: async (findOptions?: FindOptions<Config, Array<keyof Config>>) => {
      const { result } = await this.configApiClient.call({
        method: 'GET',
        action: '/config',
        query: { findOptions },
      })

      result.entries.forEach((entry) => {
        this.configCache.setExplicitValue({
          loadArgs: [entry.id],
          value: { status: 'loaded', value: entry, updatedAt: new Date() },
        })
      })

      return result
    },
  })

  constructor(private readonly configApiClient: ConfigApiClient) {}

  public getConfig = this.configCache.get.bind(this.configCache)
  public getConfigAsObservable = this.configCache.getObservable.bind(this.configCache)
  public getConfigs = this.configsQueryCache.get.bind(this.configsQueryCache)
  public getConfigsAsObservable = this.configsQueryCache.getObservable.bind(this.configsQueryCache)

  public async saveConfig<TId extends ConfigType['id']>(
    id: TId,
    value: Extract<ConfigType, { id: TId }>['value'],
  ): Promise<Config> {
    const existingConfig = await this.configCache.get(id).catch(() => null)

    if (existingConfig?.value != null) {
      await this.configApiClient.call({
        method: 'PATCH',
        action: '/config/:id',
        url: { id },
        body: { value },
      })
      this.invalidateCache(id)
      return this.configCache.get(id)
    } else {
      const { result } = await this.configApiClient.call({
        method: 'POST',
        action: '/config',
        body: { id, value },
      })
      this.invalidateCache(id)
      return result
    }
  }

  public async deleteConfig(id: ConfigType['id']): Promise<void> {
    await this.configApiClient.call({
      method: 'DELETE',
      action: '/config/:id',
      url: { id },
    })
    this.invalidateCache(id)
  }

  public invalidateCache(id?: ConfigType['id']): void {
    if (id) {
      this.configCache.obsoleteRange((config) => config.id === id)
    } else {
      this.configCache.flushAll()
    }
    this.configsQueryCache.flushAll()
  }

  public [Symbol.dispose](): void {
    this.configCache[Symbol.dispose]()
    this.configsQueryCache[Symbol.dispose]()
  }
}

export type ConfigService = ConfigServiceImpl

export const ConfigService: Token<ConfigService, 'singleton'> = defineService({
  name: 'pi-rat/ConfigService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const impl = new ConfigServiceImpl(inject(ConfigApiClient))
    // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector tear-down
    onDispose(() => impl[Symbol.dispose]())
    return impl
  },
})
