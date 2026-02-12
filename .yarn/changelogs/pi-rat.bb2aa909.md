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

## 📦 Build

- Simplified `lint-staged` configuration: removed explicit `git add` steps, switched Prettier to `--ignore-unknown` for all file types

## 🔧 Chores

- Upgraded to Shades 12 with lazy-loaded route components and shadow DOM compatibility fixes

## ⬆️ Dependencies

- Upgraded `@furystack/yarn-plugin-changelog` from ^1.0.2 to ^1.0.3
- Upgraded `@types/node` from ^25.2.2 to ^25.2.3
