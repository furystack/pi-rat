import { createComponent, Shade } from '@furystack/shades'
import { OmdbMovieMetadata } from 'common'
import mediaSchemas from 'common/schemas/media-entities.json' with { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'

export const OmdbMovieMetadataPage = Shade({
  shadowDomName: 'shade-app-omdb-movie-metadata-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(MediaApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const modelUri = modelProvider.getModelUriForEntityType({
      schemaName: 'OmdbMovieMetadata',
      jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/OmdbMovieMetadata' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: OmdbMovieMetadata,
          keyProperty: 'imdbID',
          readonlyProperties: [],
          getEntities: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/omdb-movie-metadata',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async () => {
            // await api.call({ method: 'DELETE', action: `/om/:id`, url: { id } })
            alert('Not supported')
          },
          getEntity: async (id) => {
            const result = await api.call({ method: 'GET', action: `/omdb-movie-metadata/:id`, url: { id }, query: {} })
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
