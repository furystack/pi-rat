export type ChatMessageAttachment = {
  /**
   * The unique identifier of the attachment
   */
  id: string
  /**
   * The type of the file
   */
  fileName: string
  /**
   * The type that hints how the attachment can be displayed
   */
  type: string
}

export class ChatMessage {
  /**
   * The unique identifier of the message
   */
  declare id: string

  /**
   * The content of the message
   */
  declare content: string

  /**
   * The date the message was created
   */
  declare createdAt: Date

  /**
   * The unique identifier of the user who sent the message
   */
  declare owner: string

  /**
   * The unique identifier of the chat to which this message belongs
   */
  declare chatId: string

  /**
   * The attachments of the message
   */
  declare attachments: ChatMessageAttachment[]
}
