import type { MonacoThemeData } from './theme.js'
import type { SchemaInfo } from './schema.js'

export type MonacoEditorMfeApi = {
  value: string
  language: string
  readOnly?: boolean
  automaticLayout?: boolean
  schemaInfo?: SchemaInfo
  theme?: MonacoThemeData
  onValueChange?: (value: string) => void
}
