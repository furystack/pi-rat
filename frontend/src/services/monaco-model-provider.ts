import { Injectable } from '@furystack/inject'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

@Injectable({ lifetime: 'singleton' })
export class MonacoModelProvider {
  private modelCache = new Map<string, monaco.editor.ITextModel>()

  public getModelForEntityType({ schemaName, jsonSchema }: { schemaName: string; jsonSchema: any }) {
    if (this.modelCache.has(schemaName)) {
      return this.modelCache.get(schemaName) as monaco.editor.ITextModel
    }
    const modelUri = monaco.Uri.parse(`pi-rat://shades/model-schemas-${schemaName}.json`)
    const model = monaco.editor.createModel('', 'json', modelUri)
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: `pi-rat://shades/model-schemas-${schemaName}.json`,
          fileMatch: [modelUri.toString()],
          schema: { ...jsonSchema },
        },
      ],
    })
    this.modelCache.set(schemaName, model)
    return model
  }
}
