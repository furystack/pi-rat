import { createComponent, LazyLoad, Shade } from '@furystack/shades'
import type { GenericEditorService } from './generic-editor-service'
import { MonacoEditor } from '../monaco-editor'
import type monaco from 'monaco-editor'
import { ObservableValue } from '@furystack/utils'
import { Button, NotyService } from '@furystack/shades-common-components'

export const GenericMonacoEditor = Shade<{
  entityId: any
  service: GenericEditorService<any, any>
  model?: monaco.editor.ITextModel
}>({
  shadowDomName: 'shade-generic-monaco-editor',
  render: ({ props, useDisposable, injector, useObservable }) => {
    return (
      <LazyLoad
        loader={<>Loading...</>}
        component={async () => {
          const entry = await props.service.getSingleEntry(props.entityId)
          const loadedDefaultValue = JSON.stringify(entry, undefined, 4)

          const currentValue = useDisposable('currentValue', () => new ObservableValue(loadedDefaultValue))

          useObservable(
            'currentValueChange',
            currentValue,
            (value) => {
              if (value !== loadedDefaultValue) {
                document.querySelector('.saveButton')?.removeAttribute('disabled')
                document.querySelector('.resetButton')?.removeAttribute('disabled')
              } else {
                document.querySelector('.saveButton')?.setAttribute('disabled', 'disabled')
                document.querySelector('.resetButton')?.setAttribute('disabled', 'disabled')
              }
            },
            true,
          )

          const save = async () => {
            try {
              await props.service.patchEntry(props.entityId, JSON.parse(currentValue.getValue()))
              injector
                .getInstance(NotyService)
                .addNoty({ title: 'Saved', body: 'The entity has been updated succesfully', type: 'success' })
            } catch (e) {
              injector
                .getInstance(NotyService)
                .addNoty({ title: 'Error ', body: (e as Error).toString(), type: 'error' })
            }
          }

          useDisposable('saveShortcut', () => {
            const saveHandler = (e: KeyboardEvent) => {
              if (e.ctrlKey && e.key === 's') {
                e.preventDefault()

                save()
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
                <Button color="primary" variant="contained" onclick={save} className="saveButton">
                  Save
                </Button>
              </div>
            </div>
          )
        }}
      />
    )
  },
})
