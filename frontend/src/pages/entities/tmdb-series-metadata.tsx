import { createComponent, Shade } from '@furystack/shades'
import { TmdbSeriesMetadata } from 'common'
import mediaSchemas from 'common/schemas/media-entities.json' with { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'

export const TmdbSeriesMetadataPage = Shade({
  customElementName: 'shade-app-tmdb-series-metadata-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(MediaApiClient)

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: TmdbSeriesMetadata,
          keyProperty: 'id',
          readonlyProperties: [],
          getEntities: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/tmdb-series-metadata',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async () => {
            alert('Not supported')
          },
          getEntity: async (id) => {
            const result = await api.call({
              method: 'GET',
              action: `/tmdb-series-metadata/:id`,
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
        basePath="/entities/tmdb-series-metadata"
        columns={['id', 'name', 'firstAirDate', 'language', 'updatedAt']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        schemaInfo={{
          schemaName: 'TmdbSeriesMetadata',
          jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/TmdbSeriesMetadata' },
        }}
      />
    )
  },
})
