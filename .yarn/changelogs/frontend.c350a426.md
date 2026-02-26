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

- Added null and type checks to form `validate` functions in `AiChatInput`, `CreateAiChatButton`, and `InviteButton` to prevent runtime errors when `formData` is null or not an object

## ♻️ Refactoring

- Removed `any` type casts in `GenericEditor` DataGrid by extracting row/header component maps and using `unknown` casts for type-safe column and component passing
- Adapted `GithubLogo` to use the standalone `getTextColor()` function from `@furystack/shades-common-components` instead of the removed `themeProvider.getTextColor()` method
- Added explicit `Movie` type annotation to `onSelectSuggestion` callback in `MoviePicker`

## ⬆️ Dependencies

- Updated `@furystack/core` from ^15.1.0 to ^15.2.2
- Updated `@furystack/entity-sync` from ^0.1.1 to ^1.0.3
- Updated `@furystack/entity-sync-client` from ^0.1.1 to ^1.0.3
- Updated `@furystack/rest` from ^8.0.37 to ^8.0.40
- Updated `@furystack/rest-client-fetch` from ^8.0.37 to ^8.0.40
- Updated `@furystack/shades` from ^12.1.0 to ^12.2.4
- Updated `@furystack/shades-common-components` from ^12.2.0 to ^13.0.1
- Updated `@furystack/shades-lottie` from ^8.0.2 to ^8.0.7
- Updated `media-chrome` from ^4.17.2 to ^4.18.0
- Updated `@types/node` from ^25.3.0 to ^25.3.1
