import type { AddMovieMessage } from './add-movie-message.js'
import type { ChatAddedMessage } from './chat-added.js'
import type { ChatMessageAddedMessage } from './chat-message-added.js'
import type { ChatMessageRemovedMessage } from './chat-message-removed.js'
import type { ChatMessageUpdatedMessage } from './chat-message-updated.js'
import type { ChatRemovedMessage } from './chat-removed.js'
import type { ChatUpdatedMessage } from './chat-updated.js'
import type { DeviceConnectedMessage } from './device-connected-message.js'
import type { DeviceDisconnectedMessage } from './device-disconnected-message.js'
import type { FileChangeMessage } from './file-change-message.js'

export type WebsocketMessage =
  | AddMovieMessage
  | DeviceConnectedMessage
  | DeviceDisconnectedMessage
  | FileChangeMessage
  | ChatAddedMessage
  | ChatRemovedMessage
  | ChatUpdatedMessage
  | ChatMessageAddedMessage
  | ChatMessageUpdatedMessage
  | ChatMessageRemovedMessage
