import { getStoreManager } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import { getLogger, type ScopedLogger } from '@furystack/logging'
import { Config, type OllamaConfig } from 'common'
import { Ollama, type ChatRequest } from 'ollama'

@Injectable({ lifetime: 'singleton' })
export class OllamaClientService {
  config?: OllamaConfig

  @Injected((injector) => getLogger(injector).withScope('Ollama Client Service'))
  declare private logger: ScopedLogger

  declare ollama: Ollama

  private isValidOllamaConfig<T extends Config>(config: T): config is T & OllamaConfig {
    return (
      config !== undefined &&
      config.id === 'OLLAMA_CONFIG' &&
      typeof config.value === 'object' &&
      'host' in config.value &&
      typeof config.value.host === 'string' &&
      config.value.host.trim() !== ''
    )
  }

  private getOllamaConfig = async (injector: Injector): Promise<OllamaConfig | undefined> => {
    const storeManager = getStoreManager(injector)
    const configStore = storeManager.getStoreFor(Config, 'id')
    const [ollamaConfig] = await configStore.find({
      top: 1,
      filter: {
        id: { $eq: 'OLLAMA_CONFIG' },
      },
    })

    if (!ollamaConfig || !this.isValidOllamaConfig(ollamaConfig)) {
      return undefined
    }

    return this.isValidOllamaConfig(ollamaConfig) ? ollamaConfig : undefined
  }

  public async init(injector: Injector) {
    await this.logger.verbose({ message: '🤖   Initializing Ollama Service' })
    const config = await this.getOllamaConfig(injector)
    if (!config) {
      this.config = undefined
      await this.logger.information({
        message: '🚫   No config found, Ollama Service will not be initialized',
      })
      return
    }

    this.config = config
    this.ollama = new Ollama({
      host: this.config?.value.host,
    })

    await this.logger.verbose({
      message: '✅   Ollama Service initialized',
    })
  }

  public getSupportedModels = async () => {
    if (!this.ollama) {
      throw new Error('Ollama client is not initialized')
    }

    try {
      const models = await this.ollama.list()
      return models
    } catch (error) {
      await this.logger.error({
        message: '❌  Failed to fetch supported models',
        data: { error },
      })
      throw error
    }
  }

  public chat = async (
    request: ChatRequest & {
      stream?: false
    },
  ) => {
    if (!this.ollama) {
      throw new Error('Ollama client is not initialized')
    }

    try {
      return await this.ollama.chat(request)
    } catch (error) {
      await this.logger.error({
        message: '❌  Failed to chat with Ollama',
        data: { error },
      })
      throw error
    }
  }
}
