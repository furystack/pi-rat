export class ChatInvitation {
  /**
   * The unique identifier of the chat invitation.
   * This is used to identify the invitation in the system.
   * It is a primary key in the database.
   * It is also used to reference the invitation in other models.
   */
  declare id: string

  /**
   * The foreign key to the chat entity to which this invitation belongs.
   * This is used to associate the invitation with the correct chat.
   * It is a foreign key to the Chat model.
   */
  declare chatId: string

  /**
   * The unique identifier of the user who is invited to the chat.
   * This is used to identify the user in the system.
   * It is a foreign key to the User model.
   */
  declare userId: string

  /**
   * The status of the chat invitation.
   * This is used to track whether the invitation is pending, accepted, or rejected.
   */
  declare status: 'pending' | 'accepted' | 'rejected' | 'revoked' | 'expired'

  /**
   * The timestamp when the invitation was created.
   * This is used to track when the invitation was sent.
   */
  declare createdAt: Date

  /**
   * Unique identifier of the user who created the invitation.
   * This is used to track who sent the invitation.
   * It is a foreign key to the User model.
   */
  declare createdBy: string
}
