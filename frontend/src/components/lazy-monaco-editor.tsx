import { createComponent, Shade } from '@furystack/shades'
import { ThemeProviderService } from '@furystack/shades-common-components'
import { MicroFrontend } from '@furystack/shades-mfe'

import { ObservableValue } from '@furystack/utils'
import { createMonacoTheme } from './create-monaco-theme.js'
import { FullScreenLoader } from './fullscreen-loader.js'
import type { EditorSchemaInfo } from './generic-editor/index.js'
import { GenericErrorPage } from './generic-error.js'

const MONACO_MFE_URL = '/monaco-mfe/index.js'

type LazyMonacoEditorProps = {
  value?: string
  language: string
  readOnly?: boolean
  schemaInfo?: EditorSchemaInfo
  onValueChange?: (value: string) => void
  style?: Partial<CSSStyleDeclaration>
}

export const LazyMonacoEditor = Shade<LazyMonacoEditorProps>({
  shadowDomName: 'lazy-monaco-editor',
  css: {
    display: 'block',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  render: ({ props, injector, useObservable, useDisposable }) => {
    const themeProvider = injector.getInstance(ThemeProviderService)

    const [monacoTheme, setMonacoTheme] = useObservable(
      'monacoTheme',
      new ObservableValue(createMonacoTheme(themeProvider.getAssignedTheme())),
    )

    useDisposable('themeChange', () => {
      return themeProvider.subscribe('themeChanged', (newTheme) => {
        setMonacoTheme(createMonacoTheme(newTheme))
      })
    })

    return (
      <MicroFrontend
        api={{
          value: props.value ?? '',
          language: props.language,
          readOnly: props.readOnly,
          automaticLayout: true,
          theme: monacoTheme.data,
          schemaInfo: props.schemaInfo,
          onValueChange: props.onValueChange,
        }}
        loaderCallback={() => import(/* @vite-ignore */ MONACO_MFE_URL)}
        loader={<FullScreenLoader message="Loading editor..." />}
        error={(error, retry) => <GenericErrorPage error={error} retry={retry} />}
      />
    )
  },
})
