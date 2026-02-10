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

## ♻️ Refactoring

### Migrated to `@furystack/shades` v12 API

Updated all Shade components to align with the Shades v12 API:

- Replaced `element.querySelector()` calls with the new `useRef` hook for type-safe DOM element access
- Moved `constructed` lifecycle logic into `render`, as `constructed` has been removed in v12
- Replaced `Router` with `NestedRouter` and adopted nested route object definitions
- Replaced `Route` type with `NestedRoute` for route definitions

### Type-safe routing with `navigateToRoute`

Refactored `navigateToRoute` to accept typed route paths (`AppPaths`) and infer required URL parameters from the path pattern, replacing the previous untyped `Route` object approach. Added support for `replace` navigation via `NavigateOptions`.

### Consolidated route definitions into `app-routes.tsx`

Replaced 12 separate route files (`admin-routes`, `ai-routes`, `auth-routes`, `chat-routes`, `dashboard-routes`, `entity-routes`, `file-browser-routes`, `iot-routes`, `logging-routes`, `movie-routes`, `user-routes`, `route-animations`) with a single `app-routes.tsx` file using Shades v12 nested route objects.

- Removed `Separator` component (superseded by `@furystack/shades-common-components` v12)
- Migrated `MonacoEditor` from `constructed` lifecycle to `render` with `useRef` and deferred initialization via `queueMicrotask`

## 🧪 Tests

- Updated component tests to account for Shades v12 API changes (`useRef`, removed `constructed`)

## ⬆️ Dependencies

- Upgraded `@furystack/shades` from ^11.1.0 to ^12.0.0
- Upgraded `@furystack/shades-common-components` from ^11.0.0 to ^12.0.0
- Upgraded `@furystack/shades-lottie` from ^7.0.36 to ^8.0.0
- Bumped `@furystack/cache` from ^5.0.28 to ^5.0.29
- Bumped `@furystack/core` from ^15.0.34 to ^15.0.35
- Bumped `@furystack/inject` from ^12.0.28 to ^12.0.29
- Bumped `@furystack/logging` from ^8.0.28 to ^8.0.29
- Bumped `@furystack/rest` from ^8.0.34 to ^8.0.35
- Bumped `@furystack/rest-client-fetch` from ^8.0.34 to ^8.0.35
- Bumped `@furystack/utils` to ^8.1.9
- Bumped `@types/node` from ^25.2.0 to ^25.2.2
- Bumped `video.js` from 8.23.6 to 8.23.7
