import { Shade } from '@furystack/shades'
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/editor/editor.main'

import './worker-config'
import { ThemeProviderService, defaultDarkTheme, getCssVariable } from '@furystack/shades-common-components'

export interface MonacoEditorProps {
  options: editor.IStandaloneEditorConstructionOptions
  value?: string
  onchange?: (value: string) => void
}
export const MonacoEditor = Shade<MonacoEditorProps>({
  shadowDomName: 'monaco-editor',
  constructed: ({ element, props, injector, useState }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)

    const [theme] = useState<'vs-light' | 'vs-dark'>(
      'theme',
      getCssVariable(themeProvider.theme.background.default) === defaultDarkTheme.background.default
        ? 'vs-dark'
        : 'vs-light',
    )

    const editorInstance = editor.create(element as HTMLElement, { ...props.options, theme })

    editorInstance.setValue(props.value || '')
    props.onchange &&
      editorInstance.onKeyUp(() => {
        const value = editorInstance.getValue()
        props.onchange && props.onchange(value)
      })
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
