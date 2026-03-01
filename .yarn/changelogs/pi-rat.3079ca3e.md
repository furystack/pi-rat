<!-- version-type: patch -->

# pi-rat

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

- Consolidated frontend UI components to use shared `Icon`, `Select`, `Switch`, `TextArea`, `Dialog`, `Breadcrumb`, `PageContainer`, `PageHeader`, `Drawer`, `Menu`, `Dropdown`, `Chip`, and `Typography` from `@furystack/shades-common-components`, replacing inline emojis, Material Icons, native HTML elements, and custom sidebar/dropdown implementations
- Renamed local `Icon` component to `DynamicIcon` to avoid naming collision with the shared `Icon`
- Replaced hardcoded CSS variable strings with `cssVariableTheme` token references for consistent theming

## ⬆️ Dependencies

- Bumped `@types/node` from `^25.3.2` to `^25.3.3`
- Bumped `lint-staged` from `^16.2.7` to `^16.3.0`
