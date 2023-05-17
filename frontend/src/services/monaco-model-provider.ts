import { Injectable } from '@furystack/inject'
import { editor, Uri, languages } from 'monaco-editor/esm/vs/editor/editor.api.js'

@Injectable({ lifetime: 'singleton' })
export class MonacoModelProvider {
  private modelCache = new Map<string, editor.ITextModel>()

  public getModelForEntityType({ schemaName, jsonSchema }: { schemaName: string; jsonSchema: any }) {
    if (this.modelCache.has(schemaName)) {
      return this.modelCache.get(schemaName) as editor.ITextModel
    }
    const modelUri = Uri.parse(`pi-rat://shades/model-schemas-${schemaName}.json`)
    const model = editor.createModel('', 'json', modelUri)
    languages.json.jsonDefaults.setDiagnosticsOptions({
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
