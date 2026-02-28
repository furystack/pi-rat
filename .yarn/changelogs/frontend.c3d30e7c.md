<!-- version-type: minor -->

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

### Migrated cache-dependent views to use the `CacheView` component

Replaced manual `useObservable` subscriptions with inline `isPendingCacheResult`/`isLoadedCacheResult`/`isFailedCacheResult` branching in favor of the declarative `CacheView` component from `@furystack/shades-common-components`. Each affected view is now split into a slim wrapper that provides the cache reference and a content component that receives the resolved value via `data: CacheWithValue<T>` props. This eliminates boilerplate for loading/error states across:

- Dashboard widgets (`DeviceAvailability`, `MovieWidget`, `SeriesWidget`)
- Admin settings pages (`AiSettingsPage`, `IotSettingsPage`, `OmdbSettingsPage`, `StreamingSettingsPage`)
- Admin user pages (`UserDetailsPage`, `UserListPage`)
- AI chat list (`AiChatList`)
- File browser drive selector (`DriveSelector`)
- Movie overview (`MovieOverview`)
- Related movies modal (`RelatedMoviesModalContent`)

- Changed `ConfigService.configCache` from `private` to `public` so `CacheView` can reference it directly

## ⬆️ Dependencies

- Bumped `@furystack/shades-common-components` from `^13.0.1` to `^13.1.0` to use the new `CacheView` component
