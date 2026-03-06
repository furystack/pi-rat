import { json, Uri } from 'monaco-editor'

/**
 * Must stay in sync with `EditorSchemaInfo` in `frontend/src/components/generic-editor/index.tsx`.
 */
export type SchemaInfo = {
  schemaName: string
  jsonSchema: Record<string, unknown>
}

export const registerSchema = (schemaInfo: SchemaInfo): Uri => {
  const schemaUri = `pi-rat://mfe/model-schemas-${schemaInfo.schemaName}.json`
  const modelUri = Uri.parse(schemaUri)

  const existingSchemas = (json.jsonDefaults.diagnosticsOptions.schemas || []).filter((s) => s.uri !== schemaUri)

  json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
      ...existingSchemas,
      {
        uri: schemaUri,
        fileMatch: [modelUri.toString()],
        schema: { ...schemaInfo.jsonSchema },
      },
    ],
  })

  return modelUri
}
