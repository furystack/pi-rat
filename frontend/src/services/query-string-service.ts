import type { Injector } from '@furystack/inject'
import { LocationService } from '@furystack/shades'
import type { Disposable } from '@furystack/utils'
import { ObservableValue } from '@furystack/utils'
import { deserializeQueryString, serializeToQueryString } from '@furystack/rest'

interface QueryStringVariableOptions<T> {
  locationService: LocationService
  defaultValue?: T
  updateStrategy?: 'replace' | 'push'
  key: string
}

export class QueryStringVariable<T> implements Disposable {
  public readonly currentValue = new ObservableValue<T | undefined>(this.options.defaultValue)

  private locationObserver = this.options.locationService.onLocationChanged.subscribe(() => {
    const params = new URLSearchParams(location.search)
    this.currentValue.setValue(
      (deserializeQueryString(params.get(this.options.key) as string) as T) || this.options.defaultValue,
    )
  }, true)

  private valueUpdater = this.currentValue.subscribe((newValue) => {
    const params = new URLSearchParams(location.search)
    params.set(this.options.key, serializeToQueryString(newValue as object))
    location.search = params.toString()
    this.options.locationService.updateState()
  })

  constructor(private readonly options: QueryStringVariableOptions<T>) {}
  public dispose = () => {
    this.currentValue.dispose()
    this.locationObserver.dispose()
    this.valueUpdater.dispose()
  }
}

export const useQueryStringVariable = <T>({
  injector,
  defaultValue,
  key,
}: {
  injector: Injector
  key: string
  defaultValue: T
  updateStrategy?: 'replace' | 'push'
}) => {
  const locationService = injector.getInstance(LocationService)
  const value = new ObservableValue<T>(defaultValue)
  const locationListener = locationService.onLocationChanged.subscribe(() => {
    const params = new URLSearchParams(location.search)
    value.setValue((deserializeQueryString(params.get(key) as string) as T) || defaultValue)
  }, true)
  return {
    value,
    set: (newValue: T) => {
      const params = new URLSearchParams(location.search)
      params.set(key, serializeToQueryString(newValue as object))
      location.search = params.toString()
      locationService.updateState()
    },
    dispose: () => {
      value.dispose()
      locationListener.dispose()
    },
  }
}
