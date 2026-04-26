import { getCurrentUser } from '@furystack/core'
import { useEntitySync } from '@furystack/entity-sync-service'
import type { Injector } from '@furystack/inject'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore, SequelizeStore } from '@furystack/sequelize-store'
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

const dbOptions = getDefaultDbSettings('chat.sqlite')

export const ChatStore = defineSequelizeStore<Chat, ChatModel, 'id'>({
  name: 'pi-rat/ChatStore',
  options: dbOptions,
  model: Chat,
  sequelizeModel: ChatModel,
  primaryKey: 'id',
  initModel: async (sequelize) => {
    ChatModel.init(
      {
        id: { type: STRING, primaryKey: true },
        name: STRING,
        description: { type: STRING, allowNull: true },
        createdAt: { type: DATE, defaultValue: new Date() },
        owner: { type: STRING, allowNull: false },
        participants: { type: JSON, allowNull: true, defaultValue: [] },
      },
      {
        sequelize,
        tableName: 'chats',
        indexes: [{ fields: ['owner'] }, { fields: ['participants'] }],
      },
    )
  },
})

export const ChatMessageStore = defineSequelizeStore<ChatMessage, ChatMessageModel, 'id'>({
  name: 'pi-rat/ChatMessageStore',
  options: dbOptions,
  model: ChatMessage,
  sequelizeModel: ChatMessageModel,
  primaryKey: 'id',
  initModel: async (sequelize) => {
    ChatMessageModel.init(
      {
        id: { type: STRING, primaryKey: true },
        content: STRING,
        createdAt: { type: DATE, defaultValue: new Date() },
        owner: STRING,
        chatId: { type: STRING, allowNull: false },
        attachments: { type: JSON, allowNull: true, defaultValue: [] },
      },
      {
        sequelize,
        tableName: 'chat_messages',
        indexes: [{ fields: ['chatId'] }, { fields: ['createdAt'] }],
      },
    )
  },
})

export const ChatInvitationStore = defineSequelizeStore<ChatInvitation, ChatInvitationModel, 'id'>({
  name: 'pi-rat/ChatInvitationStore',
  options: dbOptions,
  model: ChatInvitation,
  sequelizeModel: ChatInvitationModel,
  primaryKey: 'id',
  initModel: async (sequelize) => {
    ChatInvitationModel.init(
      {
        id: { type: STRING, primaryKey: true },
        chatId: { type: STRING, allowNull: false },
        chatName: { type: STRING, allowNull: false },
        message: { type: STRING, allowNull: false },
        userId: { type: STRING, allowNull: false },
        status: { type: STRING, allowNull: false },
        createdAt: { type: DATE, defaultValue: new Date() },
        createdBy: STRING,
      },
      {
        sequelize,
        tableName: 'chat_invitations',
        indexes: [{ fields: ['chatId'] }, { fields: ['userId'] }, { fields: ['status'] }],
      },
    )
  },
})

export const ChatDataSet: DataSetToken<Chat, 'id'> = defineDataSet({
  name: 'pi-rat/ChatDataSet',
  store: ChatStore,
  settings: {
    authorizeAdd: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)
      if (!user) return { isAllowed: false, message: 'User not authenticated' }
      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only create chats for yourself' }
      }
      return { isAllowed: true }
    },
    authorizeRemoveEntity: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)
      if (!user) return { isAllowed: false, message: 'User not authenticated' }
      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only delete chats for yourself' }
      }
      return { isAllowed: true }
    },
    authorizeUpdateEntity: async ({ injector: i, entity, change }) => {
      const user = await getCurrentUser(i)
      if (!user) return { isAllowed: false, message: 'User not authenticated' }
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
  },
})

export const ChatMessageDataSet: DataSetToken<ChatMessage, 'id'> = defineDataSet({
  name: 'pi-rat/ChatMessageDataSet',
  store: ChatMessageStore,
  settings: {
    authorizeAdd: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)
      if (!user) return { isAllowed: false, message: 'User not authenticated' }
      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only create messages for yourself' }
      }
      return { isAllowed: true }
    },
    authorizeRemoveEntity: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)
      if (!user) return { isAllowed: false, message: 'User not authenticated' }
      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only delete messages for yourself' }
      }
      return { isAllowed: true }
    },
    authorizeUpdateEntity: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)
      if (!user) return { isAllowed: false, message: 'User not authenticated' }
      if (entity.owner !== user.username) {
        return { isAllowed: false, message: 'You can only update messages for yourself' }
      }
      return { isAllowed: true }
    },
  },
})

export const ChatInvitationDataSet: DataSetToken<ChatInvitation, 'id'> = defineDataSet({
  name: 'pi-rat/ChatInvitationDataSet',
  store: ChatInvitationStore,
  settings: {
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
      if (!user) return { isAllowed: false, message: 'User not authenticated' }
      if (entity.createdBy !== user.username) {
        return { isAllowed: false, message: 'You can only create invitations for yourself' }
      }
      return { isAllowed: true }
    },
    authorizeRemove: async () => ({
      isAllowed: false,
      message: 'You cannot remove chat invitations directly. Use the revoke action instead.',
    }),
    authorizeGetEntity: async ({ injector: i, entity }) => {
      const user = await getCurrentUser(i)
      if (!user) return { isAllowed: false, message: 'User not authenticated' }
      if (entity.userId !== user.username && entity.createdBy !== user.username) {
        return {
          isAllowed: false,
          message: 'You can only access your own invitations or invitations you are a participant of',
        }
      }
      return { isAllowed: true }
    },
    authorizeUpdate: async () => ({
      isAllowed: false,
      message: 'You cannot update chat invitations directly. Please revoke / reject and create a new one',
    }),
  },
})

export const setupChatStore = async (injector: Injector) => {
  // Initialize Chat first so messages/invitations can build their FKs.
  // eslint-disable-next-line furystack/no-direct-store-token -- FK wiring between sequelize models requires the SequelizeStore handle
  const chatStore = injector.get(ChatStore)
  if (chatStore instanceof SequelizeStore) {
    await chatStore.getModel()
  }

  // eslint-disable-next-line furystack/no-direct-store-token -- FK wiring between sequelize models requires the SequelizeStore handle
  const messageStore = injector.get(ChatMessageStore)
  if (messageStore instanceof SequelizeStore) {
    const messageModel = await messageStore.getModel()
    messageModel.belongsTo(ChatModel, { foreignKey: 'chatId', as: 'chat', onDelete: 'CASCADE' })
  }

  // eslint-disable-next-line furystack/no-direct-store-token -- FK wiring between sequelize models requires the SequelizeStore handle
  const invitationStore = injector.get(ChatInvitationStore)
  if (invitationStore instanceof SequelizeStore) {
    const invitationModel = await invitationStore.getModel()
    invitationModel.belongsTo(ChatModel, { foreignKey: 'chatId', as: 'chat', onDelete: 'CASCADE' })
  }

  injector.get(ChatDataSet)
  injector.get(ChatMessageDataSet)
  injector.get(ChatInvitationDataSet)

  useEntitySync(injector, {
    models: [
      { dataSet: ChatDataSet as unknown as Parameters<typeof useEntitySync>[1]['models'][number]['dataSet'] },
      {
        dataSet: ChatMessageDataSet as unknown as Parameters<typeof useEntitySync>[1]['models'][number]['dataSet'],
        debounceMs: 100,
      },
    ],
  })
}
