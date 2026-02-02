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

## ✨ Features

<!-- PLACEHOLDER: Describe your shiny new features (feat:) -->

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

- Renamed `test:unit` npm script to `test` for simpler invocation

## 🧪 Tests

- Improved E2E test selectors by replacing fragile style-based locators with semantic component selectors (e.g., `user-avatar-menu`)
- Added `getUserAvatar()` helper function in E2E tests for consistent element selection
- Updated notification dismiss button selector from `.dismissNoty` to `.dismiss-button`

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

- Updated CI workflows to use the renamed `test` script instead of `test:unit`

## ⬆️ Dependencies

- Bumped `@furystack/yarn-plugin-changelog` to ^1.0.2
- Bumped `@playwright/test` to ^1.58.1
- Bumped `@types/node` to ^25.2.0
- Bumped `eslint-plugin-jsdoc` to ^62.5.0
- Bumped `jsdom` to ^28.0.0
- Bumped `typescript-eslint` to ^8.54.0

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
