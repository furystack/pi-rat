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

## ⚡ Performance

- Converted route components to lazy-loaded dynamic imports using `PiRatLazyLoad`, enabling code splitting for all page-level routes (movies, series, IoT devices, dashboards, login, register)

## 🐛 Bug Fixes

- Fixed scroll behavior in chat and AI chat message lists by moving scroll container styles from shadow DOM host CSS to inner wrapper elements
- Fixed terminal initialization timing in `LogEntriesTerminal` by deferring `terminal.open()` to a microtask, ensuring the container element is mounted in the DOM before opening
- Fixed form reset in chat and AI chat message inputs by using properly typed `HTMLFormElement` refs instead of workaround `querySelector` logic

## ♻️ Refactoring

- Replaced custom `ContextMenu` component with `ContextMenuManager` and `ContextMenu` from `@furystack/shades-common-components` in Dashboard and FileContextMenu
- Migrated `DefaultDashboard`, `ChatFlow`, and `ChatList` to the `CacheView` pattern, removing manual observable state handling for loading/error/loaded states
- Removed `uninitialized` cache state handling across all components and tests (no longer emitted by `@furystack/cache` v6)
- Removed `CannotObsoleteUnloadedError` try/catch blocks in `AiChatMessageService` (no longer thrown by `@furystack/cache` v6)
- Made service caches public (`dashboardQueryCache`, `volumesCache`, `deviceCache`, `devicePingHistoryCache`, `aiChatCache`, `aiChatQueryCache`) to support `CacheView` consumption
- Renamed `urlString` to `href` in `IconUrlWidget` for semantic clarity

## 🧪 Tests

- Added unit tests for `navigateToRoute` covering `pushState`, `replaceState`, route parameter compilation, and query string handling
- Updated cache state assertions from `'uninitialized'` to `'loading'` across all service spec files to match `@furystack/cache` v6

## ⬆️ Dependencies

- Upgraded `@furystack/cache` from ^5.0.29 to ^6.0.0 (major)
- Upgraded `@furystack/shades` from ^12.0.0 to ^12.0.1
- Upgraded `@furystack/shades-common-components` from ^12.0.0 to ^12.1.0
- Upgraded `@furystack/core`, `@furystack/rest`, `@furystack/rest-client-fetch`, `@furystack/inject`, `@furystack/logging`, `@furystack/utils`, `@furystack/shades-lottie` to latest patch versions
- Upgraded `marked` from ^17.0.1 to ^17.0.2 and `video.js` from 8.23.7 to 8.23.8
