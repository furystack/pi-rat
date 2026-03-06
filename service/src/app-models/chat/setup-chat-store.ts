import { getCurrentUser, getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { getRepository } from '@furystack/repository'
import { SequelizeStore, useSequelize } from '@furystack/sequelize-store'
import { Chat, ChatInvitation, ChatMessage } from 'common'
import { DATE, JSON, Model, STRING } from 'sequelize'
import { getDefaultDbSettings } from '../../get-default-db-options.js'

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
  declare chatName: string
  declare message: string
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

      // eslint-disable-next-line furystack/no-direct-physical-store -- Physical store access needed to initialize Sequelize model for foreign key associations
      const chatStore = getStoreManager(injector).getStoreFor(Chat, 'id')
      if (chatStore instanceof SequelizeStore) {
        await chatStore.getModel()
      }

      ChatMessageModel.belongsTo(ChatModel, {
        foreignKey: 'chatId',
        as: 'chat',
        onDelete: 'CASCADE',
      })
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
          chatName: {
            type: STRING,
            allowNull: false,
          },
          message: {
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

      // eslint-disable-next-line furystack/no-direct-physical-store -- Physical store access needed to initialize Sequelize model for foreign key associations
      const chatStore = getStoreManager(injector).getStoreFor(Chat, 'id')
      if (chatStore instanceof SequelizeStore) {
        await chatStore.getModel()
      }

      ChatInvitationModel.belongsTo(ChatModel, {
        foreignKey: 'chatId',
        as: 'chat',
        onDelete: 'CASCADE',
      })
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
    authorizeRemoveEntity: async ({ injector: i, entity }) => {
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
    authorizeRemoveEntity: async ({ injector: i, entity }) => {
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

  repo.createDataSet(ChatInvitation, 'id', {
    addFilter: async ({ injector: i, filter }) => {
      const user = await getCurrentUser(i)
      return {
        ...filter,
        filter: {
          ...filter.filter,
          $or: [{ userId: { $eq: user.username } }, { createdBy: { $eq: user.username } }],
        },
      }
    },
    authorizeAdd: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)

      if (!user) {
        return { isAllowed: false, message: 'User not authenticated' }
      }

      if (entity.createdBy !== user.username) {
        return { isAllowed: false, message: 'You can only create invitations for yourself' }
      }

      return { isAllowed: true }
    },
    authorizeRemove: async () => {
      return {
        isAllowed: false,
        message: 'You cannot remove chat invitations directly. Use the revoke action instead.',
      }
    },
    authorizeGetEntity: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)

      if (!user) {
        return { isAllowed: false, message: 'User not authenticated' }
      }

      if (entity.userId !== user.username && entity.createdBy !== user.username) {
        return {
          isAllowed: false,
          message: 'You can only access your own invitations or invitations you are a participant of',
        }
      }

      return { isAllowed: true }
    },
    authorizeUpdate: async () => {
      return {
        isAllowed: false,
        message: 'You cannot update chat invitations directly. Please revoke / reject and create a new one',
      }
    },
  })
}
