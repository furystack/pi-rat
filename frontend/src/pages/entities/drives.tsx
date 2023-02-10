import { createComponent, Shade } from '@furystack/shades'
import type { Drive } from 'common'
import { GenericEditor } from '../../components/generic-editor'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service'
import { DrivesApiClient } from '../../services/drives-api-client'

export const DrivesPage = Shade({
  shadowDomName: 'shade-app-drives-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(DrivesApiClient)
    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService<Drive, 'letter'>({
          defaultSettings: {},
          keyProperty: 'letter',
          loader: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/volumes',
              query: { findOptions },
            })
            return result.result
          },
          remover: null as any,
          singleLoader: null as any,
          updater: null as any,
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['letter', 'physicalPath']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
      />
    )
  },
})
