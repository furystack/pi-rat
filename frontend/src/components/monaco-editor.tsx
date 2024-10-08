import { Shade } from '@furystack/shades'
import type { Uri } from 'monaco-editor'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/editor/editor.main'

import { ThemeProviderService, getCssVariable } from '@furystack/shades-common-components'
import { darkTheme } from '../themes/dark.js'
import './worker-config'

export interface MonacoEditorProps {
  options: editor.IStandaloneEditorConstructionOptions
  value?: string
  onValueChange?: (value: string) => void
  modelUri?: Uri
}
export const MonacoEditor = Shade<MonacoEditorProps>({
  shadowDomName: 'monaco-editor',
  constructed: ({ element, props, injector, useState, useDisposable }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)

    const [theme] = useState<'vs-light' | 'vs-dark'>(
      'theme',
      getCssVariable(themeProvider.theme.background.default) === darkTheme.background.default ? 'vs-dark' : 'vs-light',
    )

    const editorInstance = editor.create(element as HTMLElement, { ...props.options, theme })

    editorInstance.setValue(props.value || '')
    if (props.onValueChange) {
      editorInstance.onKeyUp(() => {
        props.onValueChange?.(editorInstance.getValue())
      })
    }

    if (props.modelUri) {
      useDisposable('monacoModelUri', () => {
        const model = editor.createModel(editorInstance.getValue(), 'json', props.modelUri)
        editorInstance.setModel(model)
        return {
          [Symbol.dispose]: () => {
            model.dispose()
          },
        }
      })
    }
    return () => editorInstance.dispose()
  },
  render: ({ element }) => {
    element.style.display = 'block'
    element.style.height = 'calc(100% - 96px)'
    element.style.width = '100%'
    element.style.position = 'relative'
    return null
  },
})
