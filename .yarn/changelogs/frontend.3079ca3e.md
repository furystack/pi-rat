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

Migrated inline emoji characters and `<i className="material-icons">` usage to the `Icon` component from `@furystack/shades-common-components` across the UI. This provides theme-aware, consistent iconography. Dashboard widget shortcuts retain emojis for now (pending colored SVG/Lottie icons).

Affected areas: header navigation, command palette, file browser, generic editor, error pages, user avatar menu, theme switch, settings sidebar, IoT device panels, and movie player controls.

### Renamed local `Icon` component to `DynamicIcon`

Renamed `frontend/src/components/Icon.tsx` to `dynamic-icon.tsx` and the export from `Icon` to `DynamicIcon` to avoid confusion with the shared `Icon` from `@furystack/shades-common-components`. The `DynamicIcon` renders multi-format icons (font, url, base64, lottie) from the `common` `Icon` model.

### Replaced custom settings sidebar with `Drawer` and `Menu`

Removed the custom `SettingsSidebar`, `SettingsMenuItem`, and `SettingsMenuSection` components (and their tests). App settings and user settings pages now use the shared `Drawer` and `Menu` components from `@furystack/shades-common-components` for sidebar navigation, providing built-in active-state highlighting and grouped menu sections.

### Replaced custom user avatar dropdown with `Dropdown`

Replaced the manually implemented dropdown menu (custom open/close state, overlay, Paper wrapper) in the user avatar menu with the shared `Dropdown` component. Menu items now use structured `MenuEntry` objects with icons.

### Replaced `RoleTag` with `Chip` in user details

Replaced the custom `RoleTag` rendering in the user details page with the shared `Chip` component, using `onDelete` for role removal instead of inline buttons.

### Replaced native HTML form elements with shared components

- Replaced `<select>` with `Select` in drive selector, user role picker, and streaming settings
- Replaced `<textarea>` with `TextArea` in chat message input
- Replaced `<input type="checkbox">` with `Switch` in OMDB and streaming settings

### Adopted higher-level layout and dialog components

- Replaced custom `Modal` + `Paper` wrapper with `Dialog` in the file info modal
- Replaced custom page container CSS with `PageContainer` and `PageHeader` in admin settings, streaming settings, user details, and user list pages
- Replaced custom breadcrumb implementation with the `Breadcrumb` component in file browser
- Adopted `Typography` for text elements in settings and detail pages

### Replaced hardcoded CSS values with `cssVariableTheme` tokens

Replaced inline CSS variable strings (e.g. `'var(--theme-text-primary)'`) and hardcoded pixel values with `cssVariableTheme` references in RoleTag, user avatar menu, user details, and other components for consistent theming.

## 🧪 Tests

- Updated unit tests for user details page to interact with `shade-chip` and `shade-select` components instead of native `role-tag` and `<select>` elements
- Updated E2E tests to use `shade-switch` and `shade-select` component selectors for OMDB, streaming settings, file browser, and user management pages

## ⬆️ Dependencies

- Upgraded `@furystack/shades-common-components` from `^13.1.0` to `^13.2.0` to use newly available `Drawer`, `Menu`, `Dropdown`, `Chip`, `Select`, `Switch`, `Breadcrumb`, `PageContainer`, `PageHeader`, and `Typography` components
- Bumped `@types/node` from `^25.3.2` to `^25.3.3`
