import type { AddMovieMessage } from './add-movie-message.js'
import type { DeviceConnectedMessage } from './device-connected-message.js'
import type { DeviceDisconnectedMessage } from './device-disconnected-message.js'
import type { FileChangeMessage } from './file-change-message.js'
import type { ServiceStartedMessage } from './service-started-message.js'

export type WebsocketMessage =
  | AddMovieMessage
  | DeviceConnectedMessage
  | DeviceDisconnectedMessage
  | FileChangeMessage
  | ServiceStartedMessage
