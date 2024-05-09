import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '../../components/monaco-editor.js'
import { environmentOptions } from '../../environment-options.js'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { ObservableValue } from '@furystack/utils'
import { DrivesApiClient } from '../../services/api-clients/drives-api-client.js'

const getMonacoLanguage = (path: string) => {
  const extension = path.split('.').pop()
  switch (extension) {
    case 'js':
    case 'ts':
      return 'typescript'
    case 'json':
      return 'json'
    case 'html':
      return 'html'
    case 'md':
      return 'markdown'
    default:
      return 'plaintext'
  }
}

export const MonacoFileEditor = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-files-monaco-editor',
  render: ({ props, injector }) => {
    const { letter, path } = props

    return (
      <PiRatLazyLoad
        component={async () => {
          const result = await fetch(
            `${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
              path,
            )}/download`,
            {
              credentials: 'include',
            },
          )

          if (!result.ok) {
            throw new Error('Failed to load file')
          }

          const text = await result.text()

          return (
            <MonacoTextFileEditor
              initialValue={text}
              language={getMonacoLanguage(path)}
              onSave={() => {
                const client = injector.getInstance(DrivesApiClient)
                client.call({
                  method: 'POST',
                  action: '/volumes/:letter/:path/upload',
                  url: { letter: encodeURIComponent(letter), path: encodeURIComponent(path) },
                  body: text,
                })
              }}
            />
          )
        }}
      />
    )
  },
})

const MonacoTextFileEditor = Shade<{ initialValue: string; language: string; onSave: (newValue: string) => void }>({
  shadowDomName: 'monaco-text-file-editor',
  render: ({ props, useDisposable }) => {
    const { initialValue, language } = props

    const value = useDisposable('value', () => new ObservableValue(initialValue))

    useDisposable('save', () => {
      const onSave = (ev: KeyboardEvent) => {
        if (ev.ctrlKey && ev.key === 's') {
          ev.preventDefault()
          props.onSave(value.getValue())
        }
      }
      window.addEventListener('keydown', onSave)
      return {
        dispose: () => window.removeEventListener('keydown', onSave),
      }
    })

    return (
      <div
        style={{
          position: 'fixed',
          top: '54px',
          width: '100%',
          height: 'calc(100% - 64px)',
        }}>
        <MonacoEditor
          options={{
            language,
            automaticLayout: true,
          }}
          value={value.getValue()}
          onValueChange={(newValue) => value.setValue(newValue)}
        />
      </div>
    )
  },
})
