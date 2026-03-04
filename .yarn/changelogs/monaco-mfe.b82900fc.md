<!-- version-type: patch -->

# monaco-mfe

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

### New Monaco Editor Micro-Frontend

Standalone micro-frontend package that hosts the Monaco Editor, loaded on demand by the frontend via `@furystack/shades-mfe`. This isolates the heavy Monaco Editor bundle (~3 MB) from the main frontend build, so it is only fetched when a user opens an editor view.

**Capabilities:**

- `create()` / `destroy()` lifecycle for embedding in any container element
- JSON schema registration for validation and autocomplete in entity editors
- Theme synchronization with the host application's `ThemeProviderService`
- Automatic CSS injection on first load
