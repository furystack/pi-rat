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

- Migrated all Shades components from `shadowDomName` to `customElementName` to align with the `@furystack/shades` v13 API
- Updated `DataGrid` usage in `GenericEditor` and `FileList` to pass `findOptions` as a plain value with an `onFindOptionsChange` callback, replacing the previous `ObservableValue`-based approach

## ⬆️ Dependencies

- Upgraded `@furystack/shades` from ^12.5.0 to ^13.0.0
- Upgraded `@furystack/shades-common-components` from ^13.4.1 to ^14.0.0
- Upgraded `@furystack/shades-lottie` from ^8.0.11 to ^9.0.0
- Upgraded `@furystack/shades-mfe` from ^2.0.11 to ^3.0.0
- Upgraded `@furystack/entity-sync-client` from ^1.1.1 to ^2.0.0
- Upgraded `@furystack/rest-client-fetch` from ^8.1.1 to ^8.1.2
- Upgraded `@furystack/core` from ^15.2.4 to ^15.2.5
- Upgraded `@furystack/entity-sync` from ^1.0.5 to ^1.0.6
- Upgraded `@furystack/rest` from ^8.0.42 to ^8.1.0
