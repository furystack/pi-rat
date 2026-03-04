# Micro-Frontend Type Contracts

## Runtime Module Boundaries Require Duplicate Types

When a Micro-Frontend (MFE) is loaded at runtime via dynamic `import()`, the host and MFE cannot share compile-time types through normal imports. Types that cross this boundary must be defined separately in both packages.

### The Pattern

```
frontend/src/components/create-monaco-theme.ts  →  MonacoThemeData (host side)
monaco-mfe/src/theme.ts                         →  MonacoThemeData (MFE side)
```

Both types describe the same runtime shape but are independent TypeScript definitions.

### Rules

1. **Always add a JSDoc comment linking the counterpart type:**

   ```typescript
   /**
    * Must stay in sync with `MonacoThemeData` in `monaco-mfe/src/theme.ts`.
    * Defined separately because the MFE is loaded at runtime and cannot share
    * compile-time types with the host.
    */
   export type MonacoThemeData = {
     /* ... */
   }
   ```

2. **Keep the types structurally identical.** If one side adds a field, the other must be updated too.

3. **Prefer plain types over library-specific types** at the boundary. For example, use `Array<{ token: string; foreground?: string }>` instead of `editor.ITokenThemeRule[]` so the host doesn't need to depend on Monaco's type definitions.

4. **Name the types consistently** across packages when possible (e.g., both called `MonacoThemeData`), or use a clear naming convention (e.g., `EditorSchemaInfo` in host, `SchemaInfo` in MFE) with the JSDoc link.

### Current MFE Boundaries

| Host Type (frontend)                             | MFE Type (monaco-mfe)           | Shared Shape                              |
| ------------------------------------------------ | ------------------------------- | ----------------------------------------- |
| `MonacoThemeData` in `create-monaco-theme.ts`    | `MonacoThemeData` in `theme.ts` | Theme data (base, inherit, rules, colors) |
| `EditorSchemaInfo` in `generic-editor/index.tsx` | `SchemaInfo` in `schema.ts`     | JSON schema info (schemaName, jsonSchema) |
