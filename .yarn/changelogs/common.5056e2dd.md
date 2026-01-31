<!-- version-type: patch -->
# common

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

### Logging API

Add new Logging API for querying and streaming log entries:

- New `LoggingApi` type definition with GET endpoints for log collection and individual entries
- New `LogEntry` model with id, scope, message, data, level, and createdAt fields

### Role System

Add centralized role definitions with metadata:

- New `AVAILABLE_ROLES` constant with displayName and description for each role
- New `getRoleDefinition()` and `getAllRoleDefinitions()` helper functions
- Type-safe role metadata using `Record<Roles[number], RoleMetadata>`

### Identity API Extensions

- Add `RegisterAction` endpoint type for user self-registration
- Add `PasswordResetAction` endpoint type for password changes

### AppModel Types

Add new app-model type definitions for modular backend architecture:

- `AppModelManifest` type for app model metadata
- `AppModel` type with manifest and state properties
- `AppState` discriminated union for running/error/stopped states

### WebSocket Messages

- Add `LogEntryAddedMessage` for real-time log streaming to admin users

## 🧪 Tests

- Add unit tests for `roles.ts` helper functions
- Add unit tests for `file-utils.ts`
- Add unit tests for `url-encode-decode.ts`

## ⬆️ Dependencies

- Updated lockfile dependencies
