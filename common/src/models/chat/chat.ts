export class Chat {
  /**
   * The unique identifier
   */
  declare id: string
  /**
   * The name of the chat
   */
  declare name: string
  /**
   * The description in markdown format
   */
  declare description?: string
  /**
   * The date the chat was created
   */
  declare createdAt: Date

  /**
   * The owner of the chat
   */
  declare owner: string

  /**
   * A list of participants in the chat
   */
  declare participants: string[]
}
