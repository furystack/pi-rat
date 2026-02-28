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

- Extracted inline form validation into standalone, exported type guard functions across all frontend form components, replacing `Record<string, unknown>` casts with explicit payload types and strongly-typed `onSubmit` callbacks

## 🧪 Tests

- Added unit tests for all extracted form validation type guards covering field presence, type checking, and cross-field constraints
