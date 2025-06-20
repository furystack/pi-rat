import { getCurrentUser, getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { useSequelize } from '@furystack/sequelize-store'
import { Chat, ChatMessage, ChatMessageAttachment } from 'common'
import { DATE, JSON, Model, STRING } from 'sequelize'
import { getDefaultDbSettings } from '../get-default-db-options.js'
import { WebsocketService } from '../websocket-service.js'

class ChatModel extends Model<Chat, Chat> implements Chat {
  declare id: string
  declare name: string
  declare createdAt: Date
  declare description?: string
  declare owner: string
  declare participants: string[]
}

class ChatMessageModel extends Model<ChatMessage, ChatMessage> implements ChatMessage {
  declare id: string
  declare content: string
  declare createdAt: Date
  declare chatId: string
  declare owner: string
}

class ChatMessageAttachmentModel
  extends Model<ChatMessageAttachment, ChatMessageAttachment>
  implements ChatMessageAttachment
{
  declare id: string
  declare name: string
  declare contentType: 'image' | 'url' | 'json' | 'text' | 'other'
  declare chatMessageId: string
}

export const setupChatStore = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('ChatStore')

  const dbOptions = getDefaultDbSettings('chat.sqlite', logger)

  useSequelize({
    injector,
    options: dbOptions,
    model: Chat,
    sequelizeModel: ChatModel,
    primaryKey: 'id',
    initModel: async (sequelize) => {
      ChatModel.init(
        {
          id: {
            type: STRING,
            primaryKey: true,
          },
          name: STRING,
          description: {
            type: STRING,
            allowNull: true,
          },
          createdAt: {
            type: DATE,
            defaultValue: new Date(),
          },
          owner: {
            type: STRING,
            allowNull: false,
          },
          participants: {
            type: JSON,
            allowNull: true,
            defaultValue: [],
          },
        },
        {
          sequelize,
          tableName: 'chats',
          indexes: [
            {
              fields: ['owner'],
            },
            {
              fields: ['participants'],
            },
          ],
        },
      )
      await ChatModel.sync()
    },
  })

  useSequelize({
    injector,
    options: dbOptions,
    model: ChatMessage,
    sequelizeModel: ChatMessageModel,
    primaryKey: 'id',
    initModel: async (sequelize) => {
      ChatMessageModel.init(
        {
          id: {
            type: STRING,
            primaryKey: true,
          },
          content: STRING,
          createdAt: {
            type: DATE,
            defaultValue: new Date(),
          },
          owner: STRING,
          chatId: {
            type: STRING,
            allowNull: false,
          },
        },
        {
          sequelize,
          tableName: 'chat_messages',
          indexes: [
            {
              fields: ['chatId'],
            },
            {
              fields: ['createdAt'],
            },
          ],
        },
      )
      ChatMessageModel.belongsTo(ChatModel, {
        foreignKey: 'chatId',
        as: 'chat',
        onDelete: 'CASCADE',
      })
      await ChatMessageModel.sync()
    },
  })

  useSequelize({
    injector,
    options: dbOptions,
    model: ChatMessageAttachment,
    sequelizeModel: ChatMessageAttachmentModel,
    primaryKey: 'id',
    initModel: async (sequelize) => {
      ChatMessageAttachmentModel.init(
        {
          id: {
            type: STRING,
            primaryKey: true,
          },
          name: STRING,
          contentType: {
            type: STRING,
            allowNull: false,
          },
          chatMessageId: {
            type: STRING,
            allowNull: false,
          },
        },
        {
          sequelize,
          tableName: 'chat_message_attachments',
          indexes: [
            {
              fields: ['chatMessageId'],
            },
          ],
        },
      )
      ChatMessageAttachmentModel.belongsTo(ChatMessageModel, {
        foreignKey: 'chatMessageId',
        as: 'message',
        onDelete: 'CASCADE',
      })
      await ChatMessageAttachmentModel.sync()
    },
  })

  const repo = getRepository(injector)

  repo.createDataSet(Chat, 'id', {
    authorizeAdd: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)

      if (!user) {
        return { isAllowed: false, message: 'User not authenticated' }
      }

      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only create chats for yourself' }
      }

      return { isAllowed: true }
    },
    authroizeRemoveEntity: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)

      if (!user) {
        return { isAllowed: false, message: 'User not authenticated' }
      }

      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only delete chats for yourself' }
      }

      return { isAllowed: true }
    },
    authorizeUpdateEntity: async ({ injector: i, entity, change }) => {
      const user = await getCurrentUser(i)

      if (!user) {
        return { isAllowed: false, message: 'User not authenticated' }
      }

      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only update chats for yourself' }
      }

      if (change.owner && change.owner !== user.username) {
        return { isAllowed: false, message: 'You cannot change the owner of a chat' }
      }

      return { isAllowed: true }
    },
    addFilter: async ({ injector: i, filter }) => {
      const user = await getCurrentUser(i)
      return {
        ...filter,
        filter: {
          ...filter.filter,
          $or: [{ owner: { $eq: user.username } }, { participants: { $in: [[user.username]] } }],
        },
      }
    },
  })

  repo.createDataSet(ChatMessage, 'id', {
    authorizeAdd: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)

      if (!user) {
        return { isAllowed: false, message: 'User not authenticated' }
      }

      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only create messages for yourself' }
      }

      return { isAllowed: true }
    },
    authroizeRemoveEntity: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)

      if (!user) {
        return { isAllowed: false, message: 'User not authenticated' }
      }

      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only delete messages for yourself' }
      }

      return { isAllowed: true }
    },
    authorizeUpdateEntity: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)

      if (!user) {
        return { isAllowed: false, message: 'User not authenticated' }
      }

      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only update messages for yourself' }
      }

      return { isAllowed: true }
    },
  })

  const chatDataSet = repo.getDataSetFor(Chat, 'id')
  const chatPhysicalStore = getStoreManager(injector).getStoreFor(Chat, 'id')

  const chatMessageDataSet = repo.getDataSetFor(ChatMessage, 'id')
  const chatMessagePhysicalStore = getStoreManager(injector).getStoreFor(ChatMessage, 'id')

  const attachmentsPhysicalStore = getStoreManager(injector).getStoreFor(ChatMessageAttachment, 'id')

  const wsService = injector.getInstance(WebsocketService)

  chatDataSet.subscribe('onEntityAdded', ({ entity }) => {
    void wsService.announce({ type: 'chat-added', chat: entity }, async ({ injector: i }) => {
      const user = await getCurrentUser(i)
      if (!user) {
        return false
      }
      return entity.owner === user.username || entity.participants.includes(user.username)
    })
  })

  chatDataSet.subscribe('onEntityRemoved', ({ key }) => {
    void wsService.announce({ type: 'chat-removed', chatId: key }, async ({ injector: i }) => {
      const user = await getCurrentUser(i)
      if (!user) {
        return false
      }
      return true
    })
  })

  chatDataSet.subscribe('onEntityUpdated', ({ id, change }) => {
    const entityPromise = chatPhysicalStore.get(id)
    void wsService.announce({ type: 'chat-updated', id, change }, async ({ injector: i }) => {
      const entity = await entityPromise
      const user = await getCurrentUser(i)
      if (!user || !entity) {
        return false
      }
      return entity.owner === user.username || entity.participants.includes(user.username)
    })
  })

  chatMessageDataSet.subscribe('onEntityAdded', ({ entity }) => {
    const chatPromise = chatPhysicalStore.get(entity.chatId)
    const attachmentsPromise = attachmentsPhysicalStore.find({
      filter: { chatMessageId: { $eq: entity.id } },
    })
    Promise.all([chatPromise, attachmentsPromise])
      .then(([chat, attachments]) => {
        if (chat) {
          void wsService.announce(
            { type: 'chat-message-added', chatMessage: entity, chat, attachments },
            async ({ injector: i }) => {
              const user = await getCurrentUser(i)
              if (!user || !chat) {
                return false
              }
              return chat.owner === user.username || chat.participants.includes(user.username)
            },
          )
        }
      })
      .catch((error) => {
        void logger.error({
          message: 'Error announcing chat message added',
          data: { entity, error },
        })
      })
  })

  chatMessageDataSet.subscribe('onEntityUpdated', ({ id, change }) => {
    chatMessagePhysicalStore
      .get(id)
      .then(async (entity) => {
        if (!entity) {
          return
        }
        const chatPromise = chatPhysicalStore.get(entity.chatId)
        const attachmentsPromise = attachmentsPhysicalStore.find({
          filter: { chatMessageId: { $eq: entity.id } },
        })
        return Promise.all([chatPromise, attachmentsPromise])
      })
      .catch((error) => {
        void logger.error({
          message: 'Error getting chat message for update',
          data: { id, change, error },
        })
      })
  })
}
