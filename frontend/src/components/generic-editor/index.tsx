import { createComponent, LocationService, Shade } from '@furystack/shades'
import type { GridProps } from '@furystack/shades-common-components'
import type { EntryLoader } from '@furystack/shades-common-components'

type GenericEditorProps<T, TKey extends keyof T> = {
  entryLoader: EntryLoader<T>
  entryPatcher: (key: TKey, entry: T) => Promise<void>
  entryRemover: (...keys: TKey[]) => Promise<void>
  displayFields: Array<keyof T>
}

export const GenericEditor = Shade({
  shadowDomName: 'shade-generic-editor',
  render: ({ props, element, injector, useObservable }) => {
    const [currentId, setCurrentId] = useObservable(
      'currentId',
      injector.getInstance(LocationService).useSearchParam('currentId', null),
    )

    if (currentId) {
      return <div>{currentId}</div>
    }

    return null
  },
})
