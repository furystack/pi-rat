import { createComponent, Shade } from '@furystack/shades'
import { OmdbMovieMetadata } from 'common'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'
import mediaSchemas from 'common/schemas/media-entities.json'
import { MediaApiClient } from '../../services/media-api-client.js'

export const OmdbMovieMetadataPage = Shade({
  shadowDomName: 'shade-app-omdb-movie-metadata-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(MediaApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const model = modelProvider.getModelForEntityType({
      schemaName: 'OmdbMovieMetadata',
      jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/OmdbMovieMetadata' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          defaultSettings: {},
          model: OmdbMovieMetadata,
          keyProperty: 'imdbId',
          readonlyProperties: [],
          loader: async (findOptions) => {
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
        columns={['imdbId', 'Title', 'Year', 'updatedAt']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        model={model}
      />
    )
  },
})
