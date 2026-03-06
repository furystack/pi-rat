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

### Redesigned Login Page

The login page now features an animated card layout with glass-morphism styling, an entrance animation, and inline login error display.

### SVG Pi-Rat Logo Component

Added a new `PiRatLogo` SVG component that replaces the emoji rat in the app header with a custom pirate-rat illustration.

### Route Index Page

Added a `RouteIndexPage` component that automatically generates navigation card grids from the route tree metadata, giving parent routes a visual landing page for their children.

- Replaced raw `marked` usage in chat messages and dashboard widgets with the `MarkdownDisplay` component from `@furystack/shades-common-components`

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

### Route Module Split

Split the monolithic `app-routes.tsx` (411 lines) into per-domain route modules under `frontend/src/routes/` — auth, entity, file-browser, iot, logging, misc, movie, series, settings, and user routes — with a shared `route-meta-augmentation` for nav tree metadata (icon, title, hidden).

### URL-Based Generic Editor Navigation

Migrated `GenericEditor` from search-state-based mode management (`useSearchState`) to URL-based routing using `path-to-regexp` matchers, enabling proper browser back/forward navigation between list, edit, and create views.

### Unified Error Page

Replaced the dedicated `Error404` component with a unified `GenericErrorPage` that derives its status from `ResponseError` (404, 403, 500) and renders via the `Result` component from `@furystack/shades-common-components`.

## 🧪 Tests

- Rewrote error page tests to cover `GenericErrorPage` with 404 `ResponseError`, generic errors, Go Home / Retry / Report error button rendering

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->
