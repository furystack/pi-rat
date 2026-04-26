import { getCurrentUser } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { defineSequelizeStore, SequelizeStore } from '@furystack/sequelize-store'
import { AiChat, AiChatMessage } from 'common'
import { DATE, Model, STRING } from 'sequelize'
import { getDefaultDbSettings } from '../get-default-db-options.js'

class AiChatModel extends Model<AiChat, AiChat> implements AiChat {
  declare id: string
  declare name: string
  declare description: string
  declare model: string
  declare createdAt: Date
  declare updatedAt: Date
  declare owner: string
  declare status: 'active' | 'archived'
  declare visibility: 'private' | 'public'
}

class AiChatMessageModel extends Model<AiChatMessage, AiChatMessage> implements AiChatMessage {
  declare id: string
  declare aiChatId: string
  declare content: string
  declare role: 'user' | 'assistant'
  declare createdAt: Date
  declare updatedAt: Date
  declare visibility: 'public' | 'private'
  declare owner: string
}

const dbOptions = getDefaultDbSettings('ai.sqlite')

export const AiChatStore = defineSequelizeStore<AiChat, AiChatModel, 'id'>({
  name: 'pi-rat/AiChatStore',
  model: AiChat,
  sequelizeModel: AiChatModel,
  primaryKey: 'id',
  options: dbOptions,
  initModel: async (sequelize) => {
    AiChatModel.init(
      {
        id: { type: STRING, primaryKey: true, allowNull: false },
        name: { type: STRING, allowNull: false },
        description: { type: STRING, allowNull: true },
        createdAt: { type: DATE, allowNull: false, defaultValue: new Date() },
        model: { type: STRING, allowNull: false },
        owner: { type: STRING, allowNull: false },
        status: { type: STRING, allowNull: false, defaultValue: 'active' },
        visibility: { type: STRING, allowNull: false, defaultValue: 'private' },
      },
      {
        indexes: [{ fields: ['owner'], name: 'idx_ai_chat_owner' }],
        sequelize,
      },
    )
  },
})

export const AiChatMessageStore = defineSequelizeStore<AiChatMessage, AiChatMessageModel, 'id'>({
  name: 'pi-rat/AiChatMessageStore',
  model: AiChatMessage,
  sequelizeModel: AiChatMessageModel,
  primaryKey: 'id',
  options: dbOptions,
  initModel: async (sequelize) => {
    AiChatMessageModel.init(
      {
        id: { type: STRING, primaryKey: true, allowNull: false },
        aiChatId: { type: STRING, allowNull: false },
        content: { type: STRING, allowNull: false },
        role: { type: STRING, allowNull: false },
        createdAt: { type: DATE, allowNull: false, defaultValue: new Date() },
        visibility: { type: STRING, allowNull: false, defaultValue: 'private' },
        owner: { type: STRING, allowNull: false },
      },
      {
        indexes: [
          { fields: ['aiChatId'], name: 'idx_ai_chat_message_ai_chat_id' },
          { fields: ['owner'], name: 'idx_ai_chat_message_owner' },
          { fields: ['visibility', 'owner'], name: 'idx_ai_chat_message_visibility' },
        ],
        sequelize,
      },
    )
  },
})

export const AiChatDataSet: DataSetToken<AiChat, 'id'> = defineDataSet({
  name: 'pi-rat/AiChatDataSet',
  store: AiChatStore,
  settings: {
    modifyOnAdd: async ({ injector: i, entity }) => {
      const currentUser = await getCurrentUser(i)
      entity.owner = currentUser.username
      entity.createdAt = new Date()
      return entity
    },
    addFilter: async ({ injector: i, filter }) => {
      const currentUser = await getCurrentUser(i)
      return {
        ...filter,
        filter: {
          ...filter.filter,
          $or: [{ owner: { $eq: currentUser.username } }, { visibility: { $eq: 'public' as const } }],
        },
      }
    },
  },
})

export const AiChatMessageDataSet: DataSetToken<AiChatMessage, 'id'> = defineDataSet({
  name: 'pi-rat/AiChatMessageDataSet',
  store: AiChatMessageStore,
  settings: {
    modifyOnAdd: async ({ injector: i, entity }) => {
      const currentUser = await getCurrentUser(i)
      entity.owner = currentUser.username
      entity.createdAt = new Date()
      return entity
    },
    addFilter: async ({ injector: i, filter }) => {
      const currentUser = await getCurrentUser(i)
      return {
        ...filter,
        filter: {
          ...filter.filter,
          $or: [{ owner: { $eq: currentUser.username } }, { visibility: { $eq: 'public' as const } }],
        },
      }
    },
  },
})

export const setupAiStore = async (injector: Injector) => {
  // Initialize AiChat first so AiChatMessage's FK can reference it.
  // eslint-disable-next-line furystack/no-direct-store-token -- Need the SequelizeStore handle to wire FK relations between sequelize models
  const chatStore = injector.get(AiChatStore)
  if (chatStore instanceof SequelizeStore) {
    await chatStore.getModel()
  }
  // eslint-disable-next-line furystack/no-direct-store-token -- Need the SequelizeStore handle to wire FK relations between sequelize models
  const messageStore = injector.get(AiChatMessageStore)
  if (messageStore instanceof SequelizeStore) {
    const messageModel = await messageStore.getModel()
    messageModel.belongsTo(AiChatModel, {
      foreignKey: 'aiChatId',
      as: 'aiChat',
      onDelete: 'CASCADE',
    })
  }
  injector.get(AiChatDataSet)
  injector.get(AiChatMessageDataSet)
}
