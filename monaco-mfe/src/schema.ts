import { json, Uri } from 'monaco-editor'

const registeredSchemas = new Map<string, Uri>()

export type SchemaInfo = {
  schemaName: string
  jsonSchema: Record<string, unknown>
}

export const registerSchema = (schemaInfo: SchemaInfo): Uri => {
  if (registeredSchemas.has(schemaInfo.schemaName)) {
    return registeredSchemas.get(schemaInfo.schemaName)!
  }

  const modelUri = Uri.parse(`pi-rat://mfe/model-schemas-${schemaInfo.schemaName}.json`)
  json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
      ...(json.jsonDefaults.diagnosticsOptions.schemas || []),
      {
        uri: `pi-rat://mfe/model-schemas-${schemaInfo.schemaName}.json`,
        fileMatch: [modelUri.toString()],
        schema: { ...schemaInfo.jsonSchema },
      },
    ],
  })
  registeredSchemas.set(schemaInfo.schemaName, modelUri)
  return modelUri
}
