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

- Consolidated frontend UI components to use shared `Icon`, `Select`, `Switch`, `TextArea`, `Dialog`, `Breadcrumb`, `PageContainer`, and `PageHeader` from `@furystack/shades-common-components`, replacing inline emojis, Material Icons, and native HTML elements
- Renamed local `Icon` component to `DynamicIcon` to avoid naming collision with the shared `Icon`
