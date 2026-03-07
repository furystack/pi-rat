import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { LazyMonacoEditor } from '../../components/lazy-monaco-editor.js'
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
  customElementName: 'drives-files-monaco-editor',
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
                    url: { letter, path },
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
  customElementName: 'monaco-text-file-editor',
  css: {
    '& .editor-container': {
      position: 'fixed',
      top: '60px',
      width: '100%',
      height: 'calc(100% - 60px)',
      overflow: 'hidden',
    },
    '& .button-bar': {
      display: 'flex',
      gap: '16px',
      padding: '8px',
      justifyContent: 'flex-end',
    },
  },
  render: ({ props, useDisposable }) => {
    const { initialValue, language } = props

    // eslint-disable-next-line furystack/require-use-observable-for-render -- Intentionally non-reactive: value is read on-demand via .getValue() in keyboard/click handlers
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
      <div className="editor-container">
        <LazyMonacoEditor
          language={language}
          // eslint-disable-next-line furystack/no-direct-get-value-in-render -- Initial value for Monaco; editor manages its own state
          value={value.getValue()}
          onValueChange={(newValue) => value.setValue(newValue)}
        />
        <div className="button-bar">
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
