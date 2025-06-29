import { getCurrentUser, getStoreManager, type PhysicalStore } from '@furystack/core'
import { Injectable, Injected, type Injector } from '@furystack/inject'
import { getLogger, type ScopedLogger } from '@furystack/logging'
import { AiChatMessage, Config, type AiChat, type OllamaConfig } from 'common'
import type { Message } from 'ollama'
import { Ollama, type ChatRequest } from 'ollama'
import { isToolingSupported, OllamaTools } from './tools/ollama-tools.js'

const jsonFormat = {
  type: 'object',
  properties: {
    content: { type: 'string', description: 'The response in markdown format' },
    thinking: {
      type: 'string',
      description: 'The thought process of the AI in markdown format',
    },
    references: {
      type: 'object',
      properties: {
        movieReferences: {
          type: 'array',
          items: { type: 'string' },
          description: 'If a movie is referenced, the "imdbId" of the movie should be added to this list',
        },
        userReferences: {
          type: 'array',
          items: { type: 'string' },
          description: 'If a user is referenced, the "username" of the user should be added to this list',
        },
      },
    },
  },
  required: ['content', 'thinking', 'references'],
}

@Injectable({ lifetime: 'singleton' })
export class OllamaClientService {
  config?: OllamaConfig

  @Injected((injector) => getLogger(injector).withScope('Ollama Client Service'))
  declare private logger: ScopedLogger

  @Injected((injector) => getStoreManager(injector).getStoreFor(AiChatMessage, 'id'))
  declare private chatMessageStore: PhysicalStore<AiChatMessage, 'id'>

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

  public async handleChatMessageReceived(
    injector: Injector,
    chatMessage: AiChatMessage,
    chat: AiChat,
    history: AiChatMessage[],
  ) {
    // Ollama client is not initialized, do nothing
    if (!this.ollama) {
      return
    }

    // Check if the chat message is from the user
    if (chatMessage.role !== 'user') {
      return
    }

    const response = chatMessage.content?.trim()
    if (!response) {
      return
    }

    const { models } = await this.ollama.list()
    const currentModel = models.find((model) => model.name === chat.model)

    if (!currentModel) {
      await this.logger.error({
        message: '❌  Model not found',
        data: { model: chat.model, chatMessage, chat, history },
      })
      throw new Error(`Model ${chat.model} not found`)
    }

    const currentUser = await getCurrentUser(injector)

    const enableTooling = isToolingSupported(currentModel)

    const historyInOrder = [
      ...history
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .filter((msg) => msg.id !== chatMessage.id),
      chatMessage,
    ]

    const systemMessages: Message[] = [
      {
        role: 'system',
        content: `You are currently using the ${chat.model} model.`,
      },
      {
        role: 'system',
        content: enableTooling
          ? `You can use tools to enhance your responses.`
          : `You cannot use tools with this model.`,
      },
      {
        role: 'system',
        content: `This is the current user context in JSON format: \`${JSON.stringify(currentUser)}\`. This information is not confidential as the user already should know it`,
      },
    ]

    try {
      const messages = [
        ...systemMessages,
        ...historyInOrder.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ]

      const result = await this.chat({
        model: chat.model,
        messages: [...messages, ...(enableTooling ? [] : [{ role: 'system', content: 'Answer in JSON format' }])],
        tools: enableTooling ? OllamaTools.map((tool) => tool.toolDefinition) : [],
        stream: false,
        format: enableTooling ? undefined : jsonFormat,
      })

      const toolResponses = await Promise.all(
        OllamaTools.map(async (tool) => {
          if (tool.shouldExecute(result)) {
            return tool.execute(injector, result)
          }
          return null
        }),
      )

      const validToolResponses = toolResponses.filter((r) => r !== null)

      const resultWithToolResponses =
        validToolResponses.length > 0
          ? await this.ollama.chat({
              model: chat.model,
              messages: [
                ...historyInOrder.map((msg) => ({ role: msg.role, content: msg.content })),
                {
                  role: 'system',
                  content: 'Answer in JSON format',
                },
                ...validToolResponses.map((r) => ({
                  role: 'tool',
                  content: r,
                })),
              ],
              tools: OllamaTools.map((tool) => tool.toolDefinition),
              stream: false,
              format: jsonFormat,
            })
          : result

      await this.chatMessageStore.add({
        aiChatId: chat.id,
        role: 'assistant',
        content: resultWithToolResponses.message.content,
        createdAt: new Date(),
        owner: chat.owner,
        visibility: chat.visibility,
        id: crypto.randomUUID(),
      })
    } catch (error) {
      await this.logger.error({
        message: '❌  Failed to handle chat message',
        data: { error, chatMessage, chat, history },
      })
      throw error
    }
  }
}
