import { getCurrentUser, getStoreManager } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { Repository } from '@furystack/repository'
import { SequelizeStore, useSequelize } from '@furystack/sequelize-store'
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

export const setupAiStore = async (injector: Injector) => {
  const logger = getLogger(injector).withScope('AI Store Setup')
  await logger.verbose({ message: '🤖   Initializing AI Store' })

  const dbOptions = getDefaultDbSettings('ai.sqlite', logger)

  useSequelize({
    injector,
    model: AiChat,
    sequelizeModel: AiChatModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      AiChatModel.init(
        {
          id: {
            type: STRING,
            primaryKey: true,
            allowNull: false,
          },
          name: {
            type: STRING,
            allowNull: false,
          },
          description: {
            type: STRING,
            allowNull: true,
          },
          createdAt: {
            type: DATE,
            allowNull: false,
            defaultValue: new Date(),
          },
          model: {
            type: STRING,
            allowNull: false,
          },
          owner: {
            type: STRING,
            allowNull: false,
          },
          status: {
            type: STRING,
            allowNull: false,
            defaultValue: 'active',
          },
          visibility: {
            type: STRING,
            allowNull: false,
            defaultValue: 'private',
          },
        },
        {
          indexes: [
            {
              fields: ['owner'],
              name: 'idx_ai_chat_owner',
            },
          ],
          sequelize,
        },
      )
    },
  })

  useSequelize({
    injector,
    model: AiChatMessage,
    sequelizeModel: AiChatMessageModel,
    primaryKey: 'id',
    options: dbOptions,
    initModel: async (sequelize) => {
      AiChatMessageModel.init(
        {
          id: {
            type: STRING,
            primaryKey: true,
            allowNull: false,
          },
          aiChatId: {
            type: STRING,
            allowNull: false,
          },
          content: {
            type: STRING,
            allowNull: false,
          },
          role: {
            type: STRING,
            allowNull: false,
          },
          createdAt: {
            type: DATE,
            allowNull: false,
            defaultValue: new Date(),
          },
          visibility: {
            type: STRING,
            allowNull: false,
            defaultValue: 'private',
          },
          owner: {
            type: STRING,
            allowNull: false,
          },
        },
        {
          indexes: [
            {
              fields: ['aiChatId'],
              name: 'idx_ai_chat_message_ai_chat_id',
            },
            {
              fields: ['owner'],
              name: 'idx_ai_chat_message_owner',
            },
            {
              fields: ['visibility', 'owner'],
              name: 'idx_ai_chat_message_visibility',
            },
          ],
          sequelize,
        },
      )

      const aiChatStore = getStoreManager(injector).getStoreFor(AiChat, 'id')
      if (aiChatStore instanceof SequelizeStore) {
        await aiChatStore.getModel()
      }

      AiChatMessageModel.belongsTo(AiChatModel, {
        foreignKey: 'aiChatId',
        as: 'aiChat',
        onDelete: 'CASCADE',
      })
    },
  })

  const repository = injector.getInstance(Repository)

  repository.createDataSet(AiChat, 'id', {
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
  })

  repository.createDataSet(AiChatMessage, 'id', {
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
  })
}
