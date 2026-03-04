import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'

const MFE_THEME_NAME = 'mfe-theme'

export type MonacoThemeData = {
  base: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
  inherit: boolean
  rules: editor.ITokenThemeRule[]
  colors: Record<string, string>
}

export const applyTheme = (themeData: MonacoThemeData) => {
  editor.defineTheme(MFE_THEME_NAME, themeData)
  editor.setTheme(MFE_THEME_NAME)
}
