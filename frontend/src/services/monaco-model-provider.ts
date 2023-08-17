import { Injectable } from '@furystack/inject'
import { Uri, languages } from 'monaco-editor/esm/vs/editor/editor.api.js'

@Injectable({ lifetime: 'singleton' })
export class MonacoModelProvider {
  private nameUriCache = new Map<string, Uri>()

  public getModelUriForEntityType({ schemaName, jsonSchema }: { schemaName: string; jsonSchema: any }) {
    if (this.nameUriCache.has(schemaName)) {
      return this.nameUriCache.get(schemaName) as Uri
    }
    const modelUri = Uri.parse(`pi-rat://shades/model-schemas-${schemaName}.json`)
    languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        ...(languages.json.jsonDefaults.diagnosticsOptions.schemas || []),
        {
          uri: `pi-rat://shades/model-schemas-${schemaName}.json`,
          fileMatch: [modelUri.toString()],
          schema: { ...jsonSchema },
        },
      ],
    })
    this.nameUriCache.set(schemaName, modelUri)
    return modelUri
  }
}
