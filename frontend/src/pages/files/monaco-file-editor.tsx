import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { MonacoEditor } from '../../components/monaco-editor.js'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { environmentOptions } from '../../environment-options.js'
import { DrivesApiClient } from '../../services/api-clients/drives-api-client.js'
import { getErrorMessage } from '../../services/get-error-message.js'

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
              onSave={(newValue) => {
                const client = injector.getInstance(DrivesApiClient)
                client
                  .call({
                    method: 'PUT',
                    action: '/files/:letter/:path',
                    url: { letter: encodeURIComponent(letter), path: encodeURIComponent(path) },
                    body: { text: newValue },
                  })
                  .then(() => {
                    injector.getInstance(NotyService).emit('onNotyAdded', {
                      title: 'File saved',
                      body: `File ${path} has been saved successfully.`,
                      type: 'success',
                    })
                  })
                  .catch((error) => {
                    injector.getInstance(NotyService).emit('onNotyAdded', {
                      title: 'Failed to save file',
                      body: getErrorMessage(error),
                      type: 'error',
                    })
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
        [Symbol.dispose]: () => window.removeEventListener('keydown', onSave),
      }
    })

    return (
      <div
        style={{
          position: 'fixed',
          top: '54px',
          width: '100%',
          height: 'calc(100% - 64px)',
        }}
      >
        <MonacoEditor
          options={{
            language,
            automaticLayout: true,
          }}
          value={value.getValue()}
          onValueChange={(newValue) => value.setValue(newValue)}
        />
        <div style={{ display: 'flex', gap: '16px', padding: '8px' }}>
          <div style={{ flex: '1' }} />
          <Button className="revert" onclick={() => value.setValue(initialValue)}>
            Revert
          </Button>
          <Button className="save" variant="contained" color="primary" onclick={() => props.onSave(value.getValue())}>
            Save
          </Button>
        </div>
      </div>
    )
  },
})
