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

<!-- PLACEHOLDER: Describe your shiny new features (feat:) -->

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

### CSS Architecture Improvements

Migrated inline styles to CSS blocks using the Shades `css` property for better maintainability and separation of concerns. This change affects multiple components:

- `generic-error.tsx` - Error page layout and styling
- `user-avatar-menu.tsx` - User menu dropdown styling
- `header.tsx` - Header component styling
- `fullscreen-loader.tsx` - Loader overlay styling
- `wizard-step.tsx` - Wizard step layout
- `context-menu.tsx` - Context menu positioning
- `settings-sidebar/` - Settings menu components
- Various admin pages (`ai-settings`, `app-settings`, `omdb-settings`, `streaming-settings`, `user-details`, `user-list`)
- File browser pages (`breadcrumbs`, `file-info-modal`, `file-list`, `folder-panel`)
- Chat and AI pages
- Login and registration pages

## 🧪 Tests

<!-- PLACEHOLDER: Describe test changes (test:) -->

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

- Bumped `@furystack/shades` to ^11.1.0
- Bumped `@furystack/shades-common-components` to ^11.0.0
- Bumped `@furystack/shades-lottie` to ^7.0.36
- Bumped `@types/node` to ^25.2.0

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
