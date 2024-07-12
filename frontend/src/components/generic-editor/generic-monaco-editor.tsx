import { createComponent, Shade } from '@furystack/shades'
import type { GenericEditorService } from './generic-editor-service.js'
import { MonacoEditor } from '../monaco-editor.js'
import { Button } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Uri } from 'monaco-editor'

export const GenericMonacoEditor = Shade<{
  value: any
  onSave: (value: any) => Promise<void>
  service: GenericEditorService<any, any, any>
  modelUri?: Uri
}>({
  shadowDomName: 'shade-generic-monaco-editor',
  render: ({ props, useDisposable }) => {
    const currentValue = useDisposable('currentValue', () => new ObservableValue(JSON.stringify(props.value, null, 2)))

    useDisposable('saveShortcut', () => {
      const saveHandler = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault()
          props.onSave(JSON.parse(currentValue.getValue()))
        }
      }
      document.addEventListener('keydown', saveHandler)
      return {
        [Symbol.dispose]: () => {
          document.removeEventListener('keydown', saveHandler)
        },
      }
    })

    return (
      <div style={{ position: 'fixed', top: '50px', height: 'calc(100% - 50px)', width: '100%' }}>
        <MonacoEditor
          options={{
            language: 'json',
          }}
          modelUri={props.modelUri}
          onValueChange={currentValue.setValue.bind(currentValue)}
          value={currentValue.getValue()}
        />
        <div
          style={{
            position: 'fixed',
            bottom: '1em',
            right: '1em',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button color="secondary" variant="outlined" className="resetButton">
            Reset
          </Button>
          <Button
            color="primary"
            variant="contained"
            onclick={() => props.onSave(JSON.parse(currentValue.getValue()))}
            className="saveButton"
          >
            Save
          </Button>
        </div>
      </div>
    )
  },
})
