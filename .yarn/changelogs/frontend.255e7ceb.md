<!-- version-type: patch -->
# frontend

## ✨ Features

- Integrated `@furystack/entity-sync-client` for automatic real-time entity synchronization, replacing manual `Cache` + `WebsocketNotificationsService` patterns
- Registered `Chat`, `ChatMessage`, `LogEntry`, and `AiChatMessage` models with `EntitySyncService` in the app entry point

## ♻️ Refactoring

- Replaced `CacheView` / `useObservable` + cache patterns with `useEntitySync` and `useCollectionSync` hooks in `ChatFlow`, `ChatList`, `MessageList`, `AiChatMessageList`, `LogEntriesTerminal`, and `LogEntry` components
- Simplified `LoggingService` to use direct API calls, removing internal caches and WebSocket listener logic
- Simplified `ChatService`, `ChatMessageService`, and `AiChatMessageService` by removing cache management and WebSocket synchronization code
- Removed manual WebSocket initialization/disposal from the logging page

## 🧪 Tests

- Updated `logging-service.spec.ts` to reflect the simplified service (removed cache and observable tests, verified direct API calls)
