import { Shade, createComponent } from '@furystack/shades'
import type { Uri } from 'monaco-editor'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/editor/editor.main'

import { ThemeProviderService, getCssVariable } from '@furystack/shades-common-components'
import { darkTheme } from '../themes/dark.js'
import './worker-config'

export type MonacoEditorProps = {
  options: editor.IStandaloneEditorConstructionOptions
  value?: string
  onValueChange?: (value: string) => void
  modelUri?: Uri
}

export const MonacoEditor = Shade<MonacoEditorProps>({
  shadowDomName: 'monaco-editor',
  css: {
    display: 'block',
    height: 'calc(100% - 96px)',
    width: '100%',
    position: 'relative',
  },
  render: ({ props, injector, useState, useDisposable, useRef }) => {
    const containerRef = useRef<HTMLDivElement>('container')
    const themeProvider = injector.getInstance(ThemeProviderService)

    const [theme] = useState<'vs-light' | 'vs-dark'>(
      'theme',
      getCssVariable(themeProvider.theme.background.default) === darkTheme.background.default ? 'vs-dark' : 'vs-light',
    )

    useDisposable('monacoEditor', () => {
      let editorInstance: editor.IStandaloneCodeEditor | null = null
      let model: editor.ITextModel | null = null

      queueMicrotask(() => {
        const container = containerRef.current
        if (!container) return

        editorInstance = editor.create(container, { ...props.options, theme })
        editorInstance.setValue(props.value || '')

        if (props.onValueChange) {
          editorInstance.onKeyUp(() => {
            props.onValueChange?.(editorInstance!.getValue())
          })
        }

        if (props.modelUri) {
          model = editor.createModel(editorInstance.getValue(), 'json', props.modelUri)
          editorInstance.setModel(model)
        }
      })

      return {
        [Symbol.dispose]: () => {
          model?.dispose()
          editorInstance?.dispose()
        },
      }
    })

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  },
})
