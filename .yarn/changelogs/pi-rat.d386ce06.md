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

- Added `@furystack/eslint-plugin` with `recommendedStrict` config for stricter lint rules across all packages
- Enabled `shadesStrict` config for frontend `*.ts` and `*.tsx` files to enforce Shades-specific patterns like proper observable usage in renders

## ⬆️ Dependencies

- Bumped `@types/node` from `^25.3.3` to `^25.3.5`
