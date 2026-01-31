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

### User Registration

- Add registration page with email/password form
- Auto-login after successful registration
- Navigation to dashboard after registration

### User Settings

- Add user settings page with profile display
- Add password change functionality with current password verification

### Admin Pages

Add administration pages for system management:

- **User List**: View all users with role badges
- **User Details**: Edit user roles and view user information
- **AI Settings**: Configure Ollama AI integration
- **IoT Settings**: Manage IoT devices
- **OMDB Settings**: Configure movie metadata service
- **Streaming Settings**: Configure media streaming options
- **App Settings**: General application configuration

### Logging Page

- Add log entries page with terminal-style viewer
- Real-time log streaming via WebSocket for admin users

### Role Tag Component

- Add visual role badges with icons and colors for each role type
- Support for displaying multiple roles

### Settings Sidebar

- Add reusable settings sidebar component system
- Settings menu items with icons and active state

### Services

- Add `ConfigService` for application configuration management
- Add `UsersService` for user CRUD operations
- Add `LoggingService` for log entry queries and WebSocket streaming

## 🐛 Bug Fixes

- Fix missing `@Injected` decorator for injector in `SessionService`

## 🧪 Tests

- Add unit tests for `Icon` component
- Add unit tests for `Separator` component
- Add unit tests for `RoleTag` component
- Add unit tests for `ThemeSwitch` component
- Add unit tests for `SettingsMenuItem` component
- Add unit tests for `WizardStep` component
- Add unit tests for `Error404` component
- Add unit tests for `Widget` component
- Add unit tests for `ConfigService`
- Add unit tests for `DashboardsService`
- Add unit tests for `ErrorReporter`
- Add unit tests for `FileAssociationsService`
- Add unit tests for `GetErrorMessage`
- Add unit tests for `InstallService`
- Add unit tests for `IotDevicesService`
- Add unit tests for `LoggingService`
- Add unit tests for `MoviesService`
- Add unit tests for `SeriesService`
- Add unit tests for `SessionService`
- Add unit tests for `UsersService`
- Add unit tests for `WatchProgressUpdater`
- Add unit tests for admin pages (AI settings, IoT settings, User list, User details)

## ⬆️ Dependencies

- Updated lockfile dependencies
