# Spatial Navigation for FuryStack Shades

## Motivation

Enable D-pad / arrow-key navigation across any FuryStack Shades application. This allows Shades-based apps to run on Android TV (via Capacitor or TWA), kiosks, game controllers, and improves keyboard accessibility on desktop — without any application-specific implementation.

## Goals

- Arrow keys (Up/Down/Left/Right) move focus spatially between interactive elements
- Enter activates the focused element
- Navigation respects section boundaries (e.g. header, sidebar, main content)
- Existing mouse/touch interaction remains unaffected
- The feature is opt-in and can be enabled/disabled at runtime
- Focus indicators are visible via the theme system

## Non-Goals

- Voice navigation
- Gamepad API (may be added later)
- Application-specific navigation logic (that stays in consumer apps)

---

## Package: `@furystack/shades`

### `SpatialNavigationService`

An `@Injectable({ lifetime: 'singleton' })` service following the same pattern as `ScreenService` and `LocationService`.

#### Responsibilities

1. **Global arrow-key listener** — Intercepts `keydown` events for `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, and `Enter`.
2. **Spatial focus resolution** — On arrow key press, finds the nearest focusable element in the pressed direction using `getBoundingClientRect()` geometry.
3. **Focus movement** — Calls `.focus()` on the resolved target element.
4. **Enter activation** — On `Enter`, dispatches a `click` event on the currently focused element.
5. **Enabled state** — Exposes an `enabled: ObservableValue<boolean>` to allow toggling at runtime (e.g. disable during video playback when media keys should take priority).

#### Focusable Element Discovery

Elements are considered focusable if they match:

```
[tabindex]:not([tabindex="-1"]), a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])
```

The service queries focusable elements within the active section (or the full document if no section is active).

#### Spatial Resolution Algorithm

Given the currently focused element and a direction:

1. Get the bounding rect of the current element.
2. Collect all other focusable elements within the active section.
3. Filter to candidates that are in the correct direction:
   - **Right**: candidate's left edge > current element's left edge
   - **Left**: candidate's right edge < current element's right edge
   - **Down**: candidate's top edge > current element's top edge
   - **Up**: candidate's bottom edge < current element's bottom edge
4. Among candidates, select the one with the shortest Euclidean distance between the center points.
5. If no candidate is found within the section, optionally move to the adjacent section in that direction (cross-section navigation).

#### Section Management

Sections are DOM subtrees marked with a `data-nav-section` attribute:

```html
<div data-nav-section="header">...</div>
<div data-nav-section="sidebar">...</div>
<div data-nav-section="main-content">...</div>
```

- The active section is determined by which section contains the currently focused element.
- Arrow navigation is scoped to the active section by default.
- When no candidate exists in the current section in the pressed direction, the service looks for the nearest section in that direction and focuses its closest element.

#### Public API

```typescript
@Injectable({ lifetime: 'singleton' })
export class SpatialNavigationService implements Disposable {
  /** Toggle spatial navigation on/off at runtime */
  public enabled: ObservableValue<boolean>

  /** The currently active section name (from data-nav-section), or null if none */
  public activeSection: ObservableValue<string | null>

  /** Programmatically move focus in a direction */
  public moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void

  /** Programmatically activate (click) the currently focused element */
  public activateFocused(): void

  /** Clean up event listeners */
  public [Symbol.dispose](): void
}
```

#### Configuration

The service can be configured before first instantiation (same pattern as `useCustomSearchStateSerializer` for `LocationService`):

```typescript
export type SpatialNavigationOptions = {
  /** Whether spatial navigation is enabled on startup. Default: true */
  initiallyEnabled?: boolean

  /** Whether to allow cross-section navigation. Default: true */
  crossSectionNavigation?: boolean

  /**
   * Custom focusable selector override.
   * Default: '[tabindex]:not([tabindex="-1"]), a[href], button:not([disabled]), ...'
   */
  focusableSelector?: string
}

export const configureSpatialNavigation = (
  injector: Injector,
  options: SpatialNavigationOptions,
): void
```

#### Disposal

Follows the existing `Disposable` pattern — removes the global `keydown` listener and disposes observable values.

---

## Package: `@furystack/shades-common-components`

### Theme: Focus Ring Styles

The `cssVariableTheme.action.focusRing` variable already exists. Each theme should define a visible value for it (e.g. `2px solid <primary-main>`).

Add a global CSS injection (via `ThemeProviderService` or the style manager) that applies focus-visible styles to all focusable elements:

```css
:focus-visible {
  outline: var(--shades-theme-action-focus-ring);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

This ensures focus rings appear only during keyboard/D-pad navigation, not on mouse clicks.

### Component Integration

#### `CollectionService` / `DataGrid`

`CollectionService.handleKeyDown` already handles `ArrowUp`/`ArrowDown` for linear list navigation. When `SpatialNavigationService` is enabled:

- `DataGrid` should set `data-nav-section` on its container so spatial navigation scopes correctly within the grid.
- The existing `ArrowUp`/`ArrowDown` handling in `CollectionService` can coexist — the `DataGrid` container captures key events before they bubble to the spatial navigation service. No breaking changes needed.
- Consider adding `ArrowLeft`/`ArrowRight` support in `CollectionService` for grid-layout DataGrids (multi-column).

#### Modal / Dialog

When a modal or dialog is open, it should:

- Set `data-nav-section` on its container.
- Trap spatial navigation within its bounds (prevent cross-section escape).
- This can be done by temporarily setting `SpatialNavigationService.activeSection` to the modal's section and locking it.

Add an optional `trapFocus` prop or behavior to `Modal` and `Dialog` components that integrates with the spatial navigation service.

#### Inputs / Form Elements

Native `<input>`, `<select>`, and `<textarea>` elements should be reachable by spatial navigation but should not intercept arrow keys while focused (arrow keys have native behavior inside text inputs). The `SpatialNavigationService` should skip arrow-key interception when `document.activeElement` is an input-type element that uses arrow keys natively.

---

## Behavior Details

### Key Mapping

| Key          | Action                                              |
| ------------ | --------------------------------------------------- |
| `ArrowUp`    | Move focus to nearest element above                 |
| `ArrowDown`  | Move focus to nearest element below                 |
| `ArrowLeft`  | Move focus to nearest element to the left           |
| `ArrowRight` | Move focus to nearest element to the right          |
| `Enter`      | Activate (click) the focused element                |
| `Escape`     | (Optional) Move focus to parent section             |
| `Backspace`  | (Optional) Navigate back (maps to `history.back()`) |

### Edge Cases

- **No focusable elements**: No-op.
- **Single focusable element**: Arrow keys are no-op; Enter activates it.
- **Overlapping elements**: The element with the shortest center-to-center distance wins.
- **Scrollable containers**: When focus moves to an element outside the visible viewport, `scrollIntoView({ block: 'nearest', inline: 'nearest' })` should be called.
- **Initial focus**: When spatial navigation is enabled and no element has focus, the first focusable element in the first section (or the document) receives focus on the first arrow key press.
- **Elements entering/leaving DOM**: The service queries focusable elements on each key press (no cached element list). This is consistent with Shades' dynamic rendering model.

### Input Element Passthrough

The service must **not** intercept arrow keys when the active element is:

- `<input>` (except `type="button"`, `type="submit"`, `type="reset"`, `type="checkbox"`, `type="radio"`)
- `<textarea>`
- `<select>`
- Any element with `contenteditable="true"`

This ensures text editing, dropdown navigation, and similar native behaviors are preserved.

---

## Testing Strategy

### Unit Tests (Vitest + jsdom)

**`SpatialNavigationService`:**

- Focus moves in the correct direction based on element geometry
- Cross-section navigation works when enabled
- Cross-section navigation is blocked when disabled
- Enter dispatches click on focused element
- Arrow keys are ignored when an input element is focused
- `enabled` toggle starts/stops listening
- Disposal removes listeners
- No candidate in direction = no-op
- `scrollIntoView` is called for off-screen targets

**Theme focus styles:**

- `:focus-visible` CSS variable resolves to a visible outline

### Integration Tests

- `DataGrid` with spatial navigation: arrow keys move through rows/cells
- `Modal` traps spatial navigation within its bounds
- Section boundaries respected during navigation

---

## Migration / Breaking Changes

**None.** This is purely additive:

- `SpatialNavigationService` is a new service. Applications opt in by instantiating it (or it can be auto-registered when imported).
- Focus-visible styles are new CSS additions — no existing styles are overridden.
- `DataGrid` changes are backward-compatible (adding `data-nav-section` attribute and optional `ArrowLeft`/`ArrowRight`).
- Existing keyboard handlers in `CollectionService` continue to work.

---

## Open Questions

1. **Auto-enable vs explicit opt-in**: Should importing the service auto-register the global listener, or should apps explicitly call `injector.getInstance(SpatialNavigationService)` to activate?
2. **Backspace as "back" navigation**: Useful for TV remotes but potentially surprising on desktop. Should this be opt-in only?
3. **Focus memory per section**: When returning to a previously visited section, should the last-focused element in that section be restored? (Useful for TV UX but adds complexity.)
4. **Analog stick / gamepad**: Should the Gamepad API be in scope for a future iteration?
