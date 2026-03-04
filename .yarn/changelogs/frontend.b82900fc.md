<!-- version-type: patch -->

# frontend

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## ✨ Features

- Added `LazyMonacoEditor` component that loads Monaco Editor as a micro-frontend via `@furystack/shades-mfe`, eliminating the large Monaco bundle from the main frontend chunk
- Added entity sync lifecycle logging (`onConnect`, `onDisconnect`, `onReconnectAttempt`, `onReconnectFailed`) for better observability of WebSocket state
- Added `onResponseParseError` handler to all API clients for surfacing response parsing failures in the console

## ♻️ Refactoring

- Moved Monaco Editor schema registration from eagerly loaded `MonacoModelProvider` into the lazily loaded `GenericMonacoEditor`, deferring Monaco API usage until actually needed
- Changed `GenericEditor` to lazy-load `GenericMonacoEditor` via dynamic `import()` wrapped in `PiRatLazyLoad`, reducing initial page load
- Replaced entity page `modelUri` prop with `schemaInfo` to decouple schema definition from Monaco URI creation
- Replaced `semaphore-async-await` dependency with `Semaphore` from `@furystack/utils` in `SpeechRecognitionService`
- Changed `WebsocketNotificationsService.onInvalidMessage` event type from `any` to `unknown`

## ⬆️ Dependencies

- Upgraded all `@furystack/*` packages to their latest patch/minor versions
- Removed `semaphore-async-await` dependency in favor of `@furystack/utils` `Semaphore`
