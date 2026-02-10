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

## 🧪 Tests

- Wrapped `Injector` instances in `usingAsync()` across component and service tests to ensure proper disposal after each test case, preventing potential resource leaks between tests
