import type { FindOptions } from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import type { GetCollectionResult } from '@furystack/rest'
import type { CollectionServiceOptions } from '@furystack/shades-common-components'
import { CollectionService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { Uri } from 'monaco-editor/esm/vs/editor/editor.api.js'

type GenericEditorServiceOptions<
  T,
  TKey extends keyof T,
  TRedonlyProperties extends keyof T,
> = CollectionServiceOptions<T> & {
  model: Constructable<T>
  keyProperty: TKey
  readonlyProperties: TRedonlyProperties[]
  getEntities: (options: FindOptions<T, Array<keyof T>>) => Promise<GetCollectionResult<T>>
  getEntity: (entityKey: T[TKey]) => Promise<T | null>
  patchEntity: (entityKey: T[TKey], update: Omit<T, TRedonlyProperties>) => Promise<void>
  postEntity: (entity: Omit<T, TRedonlyProperties>) => Promise<T>
  deleteEntities: (...entities: Array<T[TKey]>) => Promise<void>
  schemaUri?: Uri
  schema?: any
}

export class GenericEditorService<T, TKey extends keyof T, TOmittedProperties extends keyof T>
  extends CollectionService<T>
  implements Disposable
{
  public editedEntry = new ObservableValue<T | null>(null)

  public findOptions: ObservableValue<FindOptions<T, Array<keyof T>>> = new ObservableValue({})

  private async onRefresh(findOptions: FindOptions<T, Array<keyof T>>) {
    const entities = await this.extendedOptions.getEntities(findOptions)
    this.data.setValue(entities)
  }

  private refreshSubscription = this.findOptions.subscribe((findOptions) => {
    void this.onRefresh(findOptions)
  })

  public [Symbol.dispose](): void {
    this.editedEntry[Symbol.dispose]()
    super[Symbol.dispose]()
    this.refreshSubscription[Symbol.dispose]()
  }

  public patchEntry = async (key: T[TKey], patch: T) => {
    this.extendedOptions.readonlyProperties.forEach((prop) => {
      delete patch[prop]
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

  public postEntry = async (entry: T) => {
    this.extendedOptions.readonlyProperties.forEach((prop) => {
      delete entry[prop]
    })

    return await this.extendedOptions.postEntity(entry)
  }

  constructor(public readonly extendedOptions: GenericEditorServiceOptions<T, TKey, TOmittedProperties>) {
    super(extendedOptions)
    void this.onRefresh(this.findOptions.getValue())
  }
}
