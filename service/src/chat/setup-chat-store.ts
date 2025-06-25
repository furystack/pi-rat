import { getCurrentUser, getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { useSequelize } from '@furystack/sequelize-store'
import { Chat, ChatInvitation, ChatMessage } from 'common'
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
  declare attachments: ChatMessage['attachments']
}

class ChatInvitationModel extends Model<ChatInvitation, ChatInvitation> implements ChatInvitation {
  declare id: string
  declare chatId: string
  declare userId: string
  declare status: 'pending' | 'accepted' | 'rejected' | 'revoked' | 'expired'
  declare createdAt: Date
  declare createdBy: string
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
          attachments: {
            type: JSON,
            allowNull: true,
            defaultValue: [],
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
    model: ChatInvitation,
    sequelizeModel: ChatInvitationModel,
    primaryKey: 'id',
    initModel: async (sequelize) => {
      ChatInvitationModel.init(
        {
          id: {
            type: STRING,
            primaryKey: true,
          },
          chatId: {
            type: STRING,
            allowNull: false,
          },
          userId: {
            type: STRING,
            allowNull: false,
          },
          status: {
            type: STRING,
            allowNull: false,
          },
          createdAt: {
            type: DATE,
            defaultValue: new Date(),
          },
          createdBy: STRING,
        },
        {
          sequelize,
          tableName: 'chat_invitations',
          indexes: [
            {
              fields: ['chatId'],
            },
            {
              fields: ['userId'],
            },
            {
              fields: ['status'],
            },
          ],
        },
      )
      ChatInvitationModel.belongsTo(ChatModel, {
        foreignKey: 'chatId',
        as: 'chat',
        onDelete: 'CASCADE',
      })
      await ChatInvitationModel.sync()
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

  chatDataSet.subscribe('onEntityUpdated', async ({ id, change }) => {
    const entity = await chatPhysicalStore.get(id)
    void wsService.announce({ type: 'chat-updated', id, change }, async ({ injector: i }) => {
      const user = await getCurrentUser(i)
      if (!user || !entity) {
        return false
      }
      return entity.owner === user.username || entity.participants.includes(user.username)
    })
  })

  chatMessageDataSet.subscribe('onEntityAdded', async ({ entity }) => {
    const chat = await chatPhysicalStore.get(entity.chatId)
    if (chat) {
      void wsService.announce({ type: 'chat-message-added', chatMessage: entity, chat }, async ({ injector: i }) => {
        const user = await getCurrentUser(i)
        if (!user || !chat) {
          return false
        }
        return chat.owner === user.username || chat.participants.includes(user.username)
      })
    }
  })

  chatMessageDataSet.subscribe('onEntityUpdated', async ({ id, change }) => {
    const reloadedChatMessage = await chatMessagePhysicalStore.get(id)
    if (!reloadedChatMessage) {
      return
    }
    const chat = await chatPhysicalStore.get(reloadedChatMessage.chatId)
    if (!chat) {
      return
    }

    void wsService.announce({ type: 'chat-message-updated', id, change, chat }, async ({ injector: i }) => {
      const currentUser = await getCurrentUser(i)
      if (!currentUser) {
        return false
      }
      return chat.owner === currentUser.username || chat.participants.includes(currentUser.username)
    })
  })

  chatMessageDataSet.subscribe('onEntityRemoved', async ({ key }) => {
    await wsService.announce({ type: 'chat-message-removed', chatMessageId: key }, async ({ injector: i }) => {
      const user = await getCurrentUser(i)
      if (!user) {
        return false
      }
      return true
    })
  })

  repo.createDataSet(ChatInvitation, 'id', {})
}
