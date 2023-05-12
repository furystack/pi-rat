import { createComponent, Shade } from '@furystack/shades'
import { MovieFile } from 'common'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'
import mediaSchemas from 'common/schemas/media-entities.json'
import { MediaApiClient } from '../../services/media-api-client.js'

export const MovieFilesPage = Shade({
  shadowDomName: 'shade-app-movie-files-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(MediaApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const model = modelProvider.getModelForEntityType({
      schemaName: 'MovieFile',
      jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/MovieFile' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          defaultSettings: {},
          model: MovieFile,
          keyProperty: 'id',
          readonlyProperties: [],
          loader: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/movie-files',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async (id) => {
            await api.call({ method: 'DELETE', action: `/movie-files/:id`, url: { id } })
          },
          getEntity: async (id) => {
            const result = await api.call({ method: 'GET', action: `/movie-files/:id`, url: { id }, query: {} })
            return result.result
          },
          patchEntity: async (id, entity) => {
            await api.call({
              method: 'PATCH',
              action: `/movie-files/:id`,
              url: { id },
              body: entity,
            })
          },
          postEntity: async (entity) => {
            const { result } = await api.call({
              method: 'POST',
              action: `/movie-files`,
              body: entity,
            })
            return result
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['driveLetter', 'path', 'id', 'movieId']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        model={model}
      />
    )
  },
})
