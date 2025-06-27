export class AiChat {
  /**
   * The unique identifier for the AI chat.
   */
  declare id: string
  /**
   * The name of the AI chat. It can be used as a context information for the AI model
   * and is also displayed in the UI.
   */
  declare name: string

  /**
   * The description of the AI chat in markdown format.
   * This can be used to provide additional context or instructions
   * for the AI model, and is also displayed in the UI.
   */
  declare description?: string

  /**
   * The date the AI chat was created.
   */
  declare createdAt: Date

  /**
   * The owner username of the AI chat.
   */
  declare owner: string

  /**
   * The model used by the AI chat, such as 'gpt-3.5-turbo' or 'gpt-4'
   * This is the model that will be used to generate responses in the chat.
   */
  declare model: string

  /**
   * The status of the AI chat, indicating whether it is active or archived
   * Archived chats can no longer be used for new messages, but can still be viewed
   * and referenced.
   */
  declare status: 'active' | 'archived'

  /**
   * Defines if the chat can be viewed by its owner only or if it's public to anyone who knows the ID.
   */
  declare visibility: 'private' | 'public'
}
