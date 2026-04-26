import { createComponent, Shade } from '@furystack/shades'
import { TmdbMovieMetadata } from 'common'
import mediaSchemas from 'common/schemas/media-entities.json' with { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'

export const TmdbMovieMetadataPage = Shade({
  customElementName: 'shade-app-tmdb-movie-metadata-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.get(MediaApiClient)

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: TmdbMovieMetadata,
          keyProperty: 'id',
          readonlyProperties: [],
          getEntities: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/tmdb-movie-metadata',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async () => {
            alert('Not supported')
          },
          getEntity: async (id) => {
            const result = await api.call({ method: 'GET', action: `/tmdb-movie-metadata/:id`, url: { id }, query: {} })
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
        basePath="/entities/tmdb-movie-metadata"
        columns={['id', 'title', 'releaseDate', 'language', 'updatedAt']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        schemaInfo={{
          schemaName: 'TmdbMovieMetadata',
          jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/TmdbMovieMetadata' },
        }}
      />
    )
  },
})
