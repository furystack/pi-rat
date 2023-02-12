import { createComponent, LazyLoad, Shade } from '@furystack/shades'
import type { GenericEditorService } from './generic-editor-service'
import { MonacoEditor } from '../monaco-editor'
import type monaco from 'monaco-editor'
import { ObservableValue } from '@furystack/utils'

export const GenericMonacoEditor = Shade<{
  entityId: any
  service: GenericEditorService<any, any>
  model?: monaco.editor.ITextModel
}>({
  shadowDomName: 'shade-generic-monaco-editor',
  render: ({ props, useDisposable }) => {
    const defaultValue = useDisposable('defaultValue', () => new ObservableValue(''))
    return (
      <LazyLoad
        loader={<>Loading...</>}
        component={async () => {
          const entry = await props.service.getSingleEntry(props.entityId)
          const loadedDefaultValue = JSON.stringify(entry, undefined, 4)
          defaultValue.setValue(loadedDefaultValue)

          return (
            <div style={{ position: 'fixed', top: '64px', height: 'calc(100% - 64px)', width: '100%' }}>
              <MonacoEditor
                options={{
                  language: 'json',
                  model: props.model,
                }}
                onchange={(value) => {
                  /** */
                }}
                value={defaultValue.getValue()}
              />
            </div>
          )
        }}
      />
    )
  },
})
