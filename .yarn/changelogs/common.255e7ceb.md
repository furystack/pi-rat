<!-- version-type: patch -->

# common

## ♻️ Refactoring

- Removed custom WebSocket message types (`ChatAddedMessage`, `ChatRemovedMessage`, `ChatUpdatedMessage`, `ChatMessageAddedMessage`, `ChatMessageUpdatedMessage`, `ChatMessageRemovedMessage`, `AiChatMessageAdded`, `LogEntryAddedMessage`) that were previously used for manual entity synchronization
- Simplified the `WebsocketMessage` union type to only include non-entity-related messages (`AddMovieMessage`, `DeviceConnectedMessage`, `DeviceDisconnectedMessage`, `FileChangeMessage`, `ServiceStartedMessage`)
