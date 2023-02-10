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
          remover: async (id) => {
            await api.call({ method: 'DELETE', action: `/volumes/:id`, url: { id } })
          },
          singleLoader: async (id) => {
            const result = await api.call({ method: 'GET', action: `/volumes/:id`, url: { id }, query: {} })
            return result.result
          },
          updater: async (id, entity) => {
            await api.call({
              method: 'PATCH',
              action: `/volumes/:id`,
              url: { id },
              body: entity,
            })
          },
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
