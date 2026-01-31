<!-- version-type: patch -->
# service

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

### App Model Architecture

Restructure backend into modular app-model architecture:

- Add `AppModelManager` for registering and managing app models
- Each feature domain now has its own app-model class with manifest and setup
- App models track their state (running/error/stopped)

### Logging System

Add database-backed logging with real-time streaming:

- `DbLogger` stores log entries to SQLite database
- REST API endpoints for querying log entries (admin only)
- WebSocket broadcasting of new log entries to admin users
- Indexed queries by createdAt, level, and scope

### User Registration

- Add `RegisterAction` for user self-registration
- Create user with empty roles by default
- Auto-login after successful registration
- Cleanup on registration failure

### Password Reset

- Add `PasswordResetAction` for authenticated password changes
- Verify current password before allowing change
- Proper error handling for complexity and authentication errors

## ♻️ Refactoring

### Directory Restructure

Move feature implementations into `app-models/` directory:

- `chat/` → `app-models/chat/`
- `config/` → `app-models/config/`
- `dashboards/` → `app-models/dashboards/`
- `drives/` → `app-models/drives/`
- `identity/` → `app-models/identity/`
- `install/` → `app-models/install/`
- `iot/` → `app-models/iot/`
- `media/` → `app-models/media/`

## 🧪 Tests

- Add unit tests for `DeleteFileAction`
- Add unit tests for `UploadAction`
- Add unit tests for `PasswordResetAction`
- Add unit tests for `RegisterAction`
- Add unit tests for `ensureMovieExists`
- Add unit tests for `linkMovie`
- Add unit tests for `wakeOnLan`
- Add unit tests for `physicalPathUtils`
- Add unit tests for `runPatch`
- Add unit tests for `checkForOrphanedPatch`

## ⬆️ Dependencies

- Updated lockfile dependencies
