import { createComponent, Shade, type ChildrenList } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { LazyMonacoEditor } from '../lazy-monaco-editor.js'
import type { GenericEditorService } from './generic-editor-service.js'
import type { EditorSchemaInfo } from './index.js'

type GenericMonacoEditorProps<T, TKey extends keyof T, TReadonlyProperties extends keyof T> = {
  value: T
  onSave: (value: T) => Promise<void>
  service: GenericEditorService<T, TKey, TReadonlyProperties>
  schemaInfo?: EditorSchemaInfo
}

type EntityFromProps<Props> = Props extends GenericMonacoEditorProps<infer T, any, any> ? T : never

export const GenericMonacoEditor: <T, TKey extends keyof T, TReadonlyProperties extends keyof T>(
  props: GenericMonacoEditorProps<T, TKey, TReadonlyProperties>,
  childrenList: ChildrenList,
) => JSX.Element = Shade({
  shadowDomName: 'shade-generic-monaco-editor',
  render: ({ props, useDisposable }) => {
    // eslint-disable-next-line furystack/require-use-observable-for-render -- Intentionally non-reactive: value is read on-demand via .getValue() in keyboard/click handlers
    const currentValue = useDisposable('currentValue', () => new ObservableValue(JSON.stringify(props.value, null, 2)))

    useDisposable('saveShortcut', () => {
      const saveHandler = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault()
          const value = JSON.parse(currentValue.getValue()) as EntityFromProps<typeof props>
          void props.onSave(value)
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
        <LazyMonacoEditor
          language="json"
          schemaInfo={props.schemaInfo}
          onValueChange={(newValue) => {
            currentValue.setValue(newValue)
          }}
          // eslint-disable-next-line furystack/no-direct-get-value-in-render -- Initial value for Monaco; editor manages its own state
          value={currentValue.getValue()}
        />
        <div
          style={{
            position: 'fixed',
            bottom: '1em',
            right: '5em',
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
            onclick={() => {
              const value = JSON.parse(currentValue.getValue()) as EntityFromProps<typeof props>
              void props.onSave(value)
            }}
            className="saveButton"
          >
            Save
          </Button>
        </div>
      </div>
    )
  },
})
