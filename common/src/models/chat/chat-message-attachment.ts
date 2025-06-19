export class ChatMessageAttachment {
  /**
   * The unique identifier of the attachment
   */
  declare id: string

  /**
   * The name of the attachment. Can be a file name or a URL.
   * This is used to display the attachment in the chat message.
   */
  declare name: string

  /**
   * The content type of the attachment.
   * This is used to determine how the attachment should be handled or displayed.
   */
  declare contentType: 'image' | 'url' | 'json' | 'text' | 'other'

  /**
   * The unique identifier to the chat message to which this attachment belongs.
   * This is used to associate the attachment with the correct chat message.
   * It is a foreign key to the ChatMessage model.
   */
  declare chatMessageId: string
}
