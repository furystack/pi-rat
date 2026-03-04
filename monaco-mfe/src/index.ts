import type { editor as editorTypes } from 'monaco-editor/esm/vs/editor/editor.api.js'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/editor/editor.main.js'
import type { MonacoEditorMfeApi } from './monaco-editor-mfe-api.js'
import { registerSchema } from './schema.js'
import { applyTheme } from './theme.js'
import './worker-config.js'

export type { MonacoEditorMfeApi } from './monaco-editor-mfe-api.js'

let editorInstance: editorTypes.IStandaloneCodeEditor | undefined

const loadCss = (() => {
  let loaded = false
  return () => {
    if (loaded) return
    loaded = true
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/monaco-mfe/index.css'
    document.head.appendChild(link)
  }
})()

const applyApiUpdate = (newApi: MonacoEditorMfeApi) => {
  if (!editorInstance) return
  if (newApi.theme) {
    applyTheme(newApi.theme)
  }
}

export const create = ({ api, rootElement }: { api: MonacoEditorMfeApi; rootElement: HTMLElement }) => {
  if (editorInstance) {
    editorInstance.dispose()
    editorInstance = undefined
  }

  loadCss()

  if (api.theme) {
    applyTheme(api.theme)
  }

  let modelUri: ReturnType<typeof registerSchema> | undefined
  if (api.schemaInfo) {
    modelUri = registerSchema(api.schemaInfo)
  }

  const container = document.createElement('div') as HTMLDivElement & {
    props: MonacoEditorMfeApi
    updateComponent: () => void
  }
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.position = 'relative'

  let currentApi = api
  Object.defineProperty(container, 'props', {
    get: () => currentApi,
    set: (newApi: MonacoEditorMfeApi) => {
      currentApi = newApi
      applyApiUpdate(newApi)
    },
  })
  container.updateComponent = () => {}

  rootElement.appendChild(container)

  editorInstance = editor.create(container, {
    value: api.value,
    language: api.language,
    readOnly: api.readOnly,
    automaticLayout: api.automaticLayout ?? true,
  })

  if (modelUri) {
    const model = editor.createModel(editorInstance.getValue(), 'json', modelUri)
    editorInstance.setModel(model)
  }

  editorInstance.onDidChangeModelContent(() => {
    currentApi.onValueChange?.(editorInstance!.getValue())
  })
}

export const destroy = () => {
  editorInstance?.dispose()
  editorInstance = undefined
}
