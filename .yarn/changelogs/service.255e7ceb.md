<!-- version-type: patch -->
# service

## ✨ Features

- Configured `@furystack/entity-sync-service` with `Chat`, `ChatMessage`, `LogEntry`, and `AiChatMessage` models for automatic entity synchronization
- Added a dedicated WebSocket endpoint at `/api/sync` to handle entity sync subscriptions

## ♻️ Refactoring

- Removed manual WebSocket event broadcasting from `setup-ai.ts`, `setup-chat-store.ts`, and `db-logger.ts` — entity change notifications are now handled automatically by the entity sync service
