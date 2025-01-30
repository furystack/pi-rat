import { createComponent, Shade } from '@furystack/shades'
import { OmdbSeriesMetadata } from 'common'
import mediaSchemas from 'common/schemas/media-entities.json' assert { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'

export const OmdbSeriesMetadataPage = Shade({
  shadowDomName: 'shade-app-omdb-series-metadata-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(MediaApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const modelUri = modelProvider.getModelUriForEntityType({
      schemaName: 'OmdbSeriesMetadata',
      jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/OmdbSeriesMetadata' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: OmdbSeriesMetadata,
          keyProperty: 'imdbID',
          readonlyProperties: [],
          getEntities: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/omdb-series-metadata',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async () => {
            // await api.call({ method: 'DELETE', action: `/om/:id`, url: { id } })
            alert('Not supported')
          },
          getEntity: async (id) => {
            const result = await api.call({
              method: 'GET',
              action: `/omdb-series-metadata/:id`,
              url: { id },
              query: {},
            })
            return result.result
          },
          patchEntity: async () => {
            alert('Not supported!')
          },
          postEntity: async (entity) => {
            alert('Not supported!')
            return entity
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['imdbID', 'Title', 'Year', 'updatedAt']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        modelUri={modelUri}
      />
    )
  },
})
