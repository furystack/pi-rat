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

### Replaced emoji and Material Icons with `Icon` component

Migrated all inline emoji characters (🎥, 📂, 🔧, etc.) and `<i className="material-icons">` usage to the `Icon` component from `@furystack/shades-common-components`. This provides theme-aware, consistent iconography across the UI.

Affected areas: header navigation, dashboard widgets, command palette, file browser, generic editor, error pages, user avatar menu, theme switch, settings sidebar, IoT device panels, and movie player controls.

### Replaced native HTML form elements with shared components

- Replaced `<select>` with `Select` in drive selector, user role picker, and streaming settings
- Replaced `<textarea>` with `TextArea` in chat message input
- Replaced `<input type="checkbox">` with `Switch` in OMDB and streaming settings

### Adopted higher-level layout and dialog components

- Replaced custom `Modal` + `Paper` wrapper with `Dialog` in the file info modal
- Replaced custom page container CSS with `PageContainer` and `PageHeader` in OMDB settings, streaming settings, and user list pages
- Replaced custom breadcrumb implementation with the `Breadcrumb` component in file browser
