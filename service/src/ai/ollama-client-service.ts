import { getCurrentUser, useSystemIdentityContext } from '@furystack/core'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { useScopedLogger, type ScopedLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { type AiChat, type AiChatMessage, type OllamaConfig } from 'common'
import type { Message } from 'ollama'
import { Ollama, type ChatRequest } from 'ollama'

import { type ConfigWatcher, createConfigWatcher } from '../utils/config-watcher.js'
import { ConfigDataSet } from '../app-models/config/setup-config-store.js'
import { AiChatMessageDataSet } from './setup-ai-store.js'
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

export interface OllamaClientService {
  config?: OllamaConfig
  init(): void
  getSupportedModels(): Promise<Awaited<ReturnType<Ollama['list']>>>
  chat(request: ChatRequest & { stream?: false }): Promise<Awaited<ReturnType<Ollama['chat']>>>
  handleChatMessageReceived(
    injector: Injector,
    chatMessage: AiChatMessage,
    chat: AiChat,
    history: AiChatMessage[],
  ): Promise<void>
}

class OllamaClientServiceImpl implements OllamaClientService {
  public config?: OllamaConfig
  public ollama: Ollama | undefined
  private configWatcher?: ConfigWatcher

  constructor(
    private readonly logger: ScopedLogger,
    private readonly systemInjector: Injector,
  ) {}

  public init() {
    void this.initAsync().catch((error) => {
      void this.logger.error({ message: 'Failed to initialize Ollama Client Service', data: { error } })
    })
  }

  public dispose() {
    this.configWatcher?.dispose()
  }

  private async initAsync() {
    this.configWatcher?.dispose()
    this.configWatcher = createConfigWatcher<OllamaConfig>({
      configDataSet: getDataSetFor(this.systemInjector, ConfigDataSet),
      systemInjector: this.systemInjector,
      logger: this.logger,
      configId: 'OLLAMA_CONFIG',
      serviceName: 'Ollama Service',
      onChange: (config) => {
        this.config = config
        this.ollama = config ? new Ollama({ host: config.value.host }) : undefined
      },
    })
    await this.configWatcher.init()
  }

  public getSupportedModels = async () => {
    if (!this.ollama) {
      throw new Error('Ollama client is not initialized')
    }
    try {
      return await this.ollama.list()
    } catch (error) {
      await this.logger.error({
        message: '❌  Failed to fetch supported models',
        data: { error },
      })
      throw error
    }
  }

  public chat: OllamaClientService['chat'] = async (request) => {
    if (!this.ollama) {
      throw new Error('Ollama client is not initialized')
    }
    try {
      return await this.ollama.chat(request)
    } catch (error) {
      await this.logger.error({ message: '❌  Failed to chat with Ollama', data: { error } })
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

      await getDataSetFor(this.systemInjector, AiChatMessageDataSet).add(this.systemInjector, {
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

export const OllamaClientService: Token<OllamaClientService, 'singleton'> = defineService({
  name: 'pi-rat/OllamaClientService',
  lifetime: 'singleton',
  factory: (ctx) => {
    const { injector, onDispose } = ctx
    const logger = useScopedLogger(ctx)
    const systemInjector = useSystemIdentityContext({ injector, username: 'ollama-service' })
    const impl = new OllamaClientServiceImpl(logger, systemInjector)
    onDispose(() => impl.dispose())
    onDispose(() => systemInjector[Symbol.asyncDispose]())
    return impl
  },
})
