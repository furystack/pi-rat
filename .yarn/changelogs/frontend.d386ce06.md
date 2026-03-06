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

## 🐛 Bug Fixes

- Fixed `GenericEditorService` not disposing `findOptions` observable, causing a resource leak
- Fixed `SessionService` setting values on disposed observables when async operations complete after disposal by adding `isDisposed` guards
- Fixed `DrivesService.dispose()` not cleaning up caches and not using the standard `[Symbol.dispose]()` protocol

## ♻️ Refactoring

- Added `Disposable` implementation to 13 singleton services (`AiChatService`, `AiModelService`, `ChatInvitationService`, `ConfigService`, `DashboardService`, `DrivesService`, `FfprobeService`, `InstallService`, `IotDevicesService`, `MovieFilesService`, `MoviesService`, `SeriesService`, `UsersService`, `WatchProgressService`, `SessionService`) to properly dispose their Cache instances
- Replaced direct `window.history.pushState/replaceState` + `locationService.updateState()` calls with `locationService.navigate()` / `locationService.replace()` in `navigateToRoute`, `GenericEditor`, and `RouteIndexPage`
- Migrated `SecuritySection` settings page from manual `ObservableValue` + `useDisposable` to `useState` hook for simpler state management

## 🧪 Tests

- Wrapped test cases in `widget-card.spec.tsx` with `usingAsync()` for proper Injector cleanup instead of manual `[Symbol.asyncDispose]()` calls
- Wrapped test cases in `movie-player-service.spec.ts` with `usingAsync()` for proper service cleanup instead of manual `[Symbol.asyncDispose]()` calls

## ⬆️ Dependencies

- Bumped `@furystack/cache` from `^6.1.0` to `^6.1.1`
- Bumped `@furystack/core` from `^15.2.3` to `^15.2.4`
- Bumped `@furystack/entity-sync` from `^1.0.4` to `^1.0.5`
- Bumped `@furystack/entity-sync-client` from `^1.1.0` to `^1.1.1`
- Bumped `@furystack/inject` from `^12.0.31` to `^12.0.32`
- Bumped `@furystack/logging` from `^8.1.0` to `^8.1.1`
- Bumped `@furystack/rest` from `^8.0.41` to `^8.0.42`
- Bumped `@furystack/rest-client-fetch` from `^8.1.0` to `^8.1.1`
- Bumped `@furystack/shades` from `^12.4.0` to `^12.5.0`
- Bumped `@furystack/shades-common-components` from `^13.4.0` to `^13.4.1`
- Bumped `@furystack/shades-lottie` from `^8.0.10` to `^8.0.11`
- Bumped `@furystack/shades-mfe` from `^2.0.10` to `^2.0.11`
- Bumped `@furystack/utils` from `^8.2.0` to `^8.2.1`
- Bumped `@types/node` from `^25.3.3` to `^25.3.5`
