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

### Extracted form validation into standalone type guard functions

Inline `validate` callbacks across all form components have been replaced with exported, reusable type guard functions and explicit payload types. This removes `Record<string, unknown>` casts and manual `FormData` extraction in favor of strongly-typed `onSubmit` callbacks provided by the `Form` component.

**Affected components:**

- `Login` / `Register` - Extracted `isLoginPayload` and `isRegisterPayload` type guards
- `WizardStep` - Now uses the `Form` component internally with a typed `onSubmit(data)` instead of raw `SubmitEvent` handling
- `CreateAdminStep` / `AddDriveStep` - Replaced manual `new FormData()` + `Object.fromEntries()` extraction with typed form data via `WizardStep`
- `AiSettings` / `IotSettings` / `OmdbSettings` / `StreamingSettings` - Extracted `isOllamaRawFormData`, `isIotRawFormData`, `isOmdbRawFormData`, and corresponding validation helpers
- `AddChatButton` / `InviteButton` / `MessageInput` - Extracted `isAddChatPayload`, `isInvitePayload`, `isChatMessagePayload` type guards
- `CreateAiChatButton` / `UserSettings` - Extracted `isCreateAiChatPayload` and `isPasswordResetPayload` type guards

## 🧪 Tests

- Added unit tests for `isLoginPayload` and `isRegisterPayload` validation logic
- Added unit tests for `isCreateAdminPayload` covering field presence and password confirmation matching
- Added unit tests for `isOllamaRawFormData` URL validation and `isIotRawFormData` numeric range constraints
- Added unit tests for `isOmdbRawFormData` and streaming settings form validation
- Added unit tests for `isChatMessagePayload`, `isAddChatPayload`, and `isInvitePayload` type guards
- Added unit tests for `isCreateAiChatPayload` and `isPasswordResetPayload` validation
- Added unit tests for `isAddDrivePayload` drive creation validation
- Added unit tests for `WizardStep` verifying integration with the `Form` component and `validate` prop
