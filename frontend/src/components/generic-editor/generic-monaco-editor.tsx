import { createComponent, Shade } from '@furystack/shades'
import type { GenericEditorService } from './generic-editor-service'
import { MonacoEditor } from '../monaco-editor'
import type monaco from 'monaco-editor'
import { Button } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

export const GenericMonacoEditor = Shade<{
  value: any
  onSave: (value: any) => Promise<void>
  service: GenericEditorService<any, any, any>
  model?: monaco.editor.ITextModel
}>({
  shadowDomName: 'shade-generic-monaco-editor',
  render: ({ props, useDisposable }) => {
    const currentValue = useDisposable('currentValue', () => new ObservableValue(JSON.stringify(props.value, null, 2)))

    // useObservable(
    //   'currentValueChange',
    //   currentValue,
    //   (value) => {
    //     if (value !== props.value) {
    //       document.querySelector('.saveButton')?.removeAttribute('disabled')
    //       document.querySelector('.resetButton')?.removeAttribute('disabled')
    //     } else {
    //       document.querySelector('.saveButton')?.setAttribute('disabled', 'disabled')
    //       document.querySelector('.resetButton')?.setAttribute('disabled', 'disabled')
    //     }
    //   },
    //   true,
    // )

    useDisposable('saveShortcut', () => {
      const saveHandler = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault()
          props.onSave(JSON.parse(currentValue.getValue()))
        }
      }
      document.addEventListener('keydown', saveHandler)
      return {
        dispose: () => {
          document.removeEventListener('keydown', saveHandler)
        },
      }
    })

    return (
      <div style={{ position: 'fixed', top: '50px', height: 'calc(100% - 50px)', width: '100%' }}>
        <MonacoEditor
          options={{
            language: 'json',
            model: props.model,
          }}
          onchange={currentValue.setValue.bind(currentValue)}
          value={currentValue.getValue()}
        />
        <div
          style={{
            position: 'fixed',
            bottom: '1em',
            right: '1em',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
          <Button color="secondary" variant="outlined" className="resetButton">
            Reset
          </Button>
          <Button
            color="primary"
            variant="contained"
            onclick={() => props.onSave(JSON.parse(currentValue.getValue()))}
            className="saveButton">
            Save
          </Button>
        </div>
      </div>
    )
  },
})
