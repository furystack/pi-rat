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
}
