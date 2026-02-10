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

## ⚡ Performance

- Converted route components to lazy-loaded dynamic imports using `PiRatLazyLoad`, enabling code splitting for all page-level routes (movies, series, IoT devices, dashboards, login, register)

## 🐛 Bug Fixes

- Fixed scroll behavior in chat and AI chat message lists by moving scroll container styles from shadow DOM host CSS to inner wrapper elements
- Fixed terminal initialization timing in `LogEntriesTerminal` by deferring `terminal.open()` to a microtask, ensuring the container element is mounted in the DOM before opening
- Fixed form reset in chat and AI chat message inputs by using properly typed `HTMLFormElement` refs instead of workaround `querySelector` logic

## ♻️ Refactoring

- Renamed `urlString` to `href` in `IconUrlWidget` for semantic clarity

## 🧪 Tests

- Added unit tests for `navigateToRoute` covering `pushState`, `replaceState`, route parameter compilation, and query string handling
