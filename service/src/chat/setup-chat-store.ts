import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { useSequelize } from '@furystack/sequelize-store'
import { Chat, ChatMessage, ChatMessageAttachment } from 'common'
import { DATE, Model, STRING } from 'sequelize'
import { getDefaultDbSettings } from '../get-default-db-options.js'

class ChatModel extends Model<Chat, Chat> implements Chat {
  declare id: string
  declare name: string
  declare createdAt: Date
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
        },
        {
          sequelize,
          tableName: 'chats',
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
}
