import type { editor as editorTypes } from 'monaco-editor/esm/vs/editor/editor.api.js'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'

const MFE_THEME_NAME = 'mfe-theme'

/**
 * Must stay in sync with `MonacoThemeData` in `frontend/src/components/create-monaco-theme.ts`.
 * Defined separately because the MFE is loaded at runtime and cannot share
 * compile-time types with the host.
 */
export type MonacoThemeData = {
  base: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
  inherit: boolean
  rules: Array<{ token: string; foreground?: string; background?: string; fontStyle?: string }>
  colors: Record<string, string>
}

export const applyTheme = (themeData: MonacoThemeData) => {
  editor.defineTheme(MFE_THEME_NAME, themeData as editorTypes.IStandaloneThemeData)
  editor.setTheme(MFE_THEME_NAME)
}
