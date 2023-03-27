import type { Constructable } from '@furystack/inject'
import type { CollectionServiceOptions } from '@furystack/shades-common-components'
import { CollectionService } from '@furystack/shades-common-components'
import type { Disposable } from '@furystack/utils'
import { ObservableValue } from '@furystack/utils'
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

type GenericEditorServiceOptions<
  T,
  TKey extends keyof T,
  TRedonlyProperties extends keyof T,
> = CollectionServiceOptions<T> & {
  model: Constructable<T>
  keyProperty: TKey
  readonlyProperties: TRedonlyProperties[]
  getEntity: (entityKey: T[TKey]) => Promise<T | null>
  patchEntity: (entityKey: T[TKey], update: Omit<T, TRedonlyProperties>) => Promise<void>
  postEntity: (entity: Omit<T, TRedonlyProperties>) => Promise<T>
  deleteEntities: (...entities: Array<T[TKey]>) => Promise<void>
  schemaUri?: monaco.Uri
  schema?: any
}

export class GenericEditorService<T, TKey extends keyof T, TOmittedProperties extends keyof T>
  extends CollectionService<T>
  implements Disposable
{
  public editedEntry = new ObservableValue<T | null>(null)

  public dispose(): void {
    this.editedEntry.dispose()
    super.dispose()
  }

  public patchEntry = async (key: T[TKey], patch: T) => {
    this.extendedOptions.readonlyProperties.forEach((prop) => {
      delete (patch as any)[prop]
    })
    await this.extendedOptions.patchEntity(key, patch)
  }

  public removeEntries = async (...keys: Array<T[TKey]>) => {
    await this.extendedOptions.deleteEntities(...keys)
    const editedEntry = this.editedEntry.getValue()
    const editedKey = editedEntry && editedEntry[this.extendedOptions.keyProperty]
    if (editedKey && keys.includes(editedKey)) {
      this.editedEntry.setValue(null)
    }
  }

  public getSingleEntry = async (key: T[TKey]) => {
    return await this.extendedOptions.getEntity(key)
  }

  public postEntry = async (entry: Omit<T, TOmittedProperties>) => {
    this.extendedOptions.readonlyProperties.forEach((prop) => {
      delete (entry as any)[prop]
    })

    return await this.extendedOptions.postEntity(entry)
  }

  constructor(public readonly extendedOptions: GenericEditorServiceOptions<T, TKey, TOmittedProperties>) {
    super(extendedOptions)
  }
}
