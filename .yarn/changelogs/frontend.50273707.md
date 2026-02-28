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

### Extracted reusable `WidgetCard` component for dashboard widgets

Consolidated duplicated card layout, focus/blur animations, overlay, and title bar styling from `DeviceAvailability`, `MovieWidget`, and `SeriesWidget` into a single `WidgetCard` component with shared CSS classes (`.card`, `.cover`, `.overlay`, `.title-bar`).

### Extracted shared animation constants into `widget-animations.ts`

Centralized animation timing, easing curves, and helper functions (`widgetCoverFocus`, `widgetCoverBlur`, `widgetEntrance`) that were copy-pasted across all dashboard widget files.

### Extracted `MediaOverviewLayout` component for media detail pages

Deduplicated the poster image + details panel layout (with responsive sizing and poster entrance animation) shared between `MovieOverview` and `SeriesOverview` into a single reusable component.

### Simplified movie player by removing dead code branches

Removed the `ENABLE_MEDIA_CHROME` flag (always `true`) along with its unused fallback `<video>` branch and the custom mouse-move show/hide overlay animation logic.

- Extracted `triggerDownload()` utility to replace inline download-via-anchor-element pattern in the file browser
- Simplified `WizardStep` form sizing from imperative ref-based resizing to declarative CSS styles
- Simplified `UserDetailsContent` state management by replacing manual `ObservableValue` + `useObservable` with `useState` for simple values (`isSaving`, `validationError`, `selectedRole`)
- Wrapped bare `setTimeout` calls in `useDisposable` for proper cleanup on component disposal
- Replaced `interface` with `type` and `any` with `unknown` in `GenericErrorProps`, `GenericEditorServiceOptions`, and `MoviePlayerProps`
