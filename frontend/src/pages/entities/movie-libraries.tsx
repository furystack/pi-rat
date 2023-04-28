import { createComponent, Shade } from '@furystack/shades'
import { MovieLibrary } from 'common'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'
import mediaSchemas from 'common/schemas/media-entities.json'
import { MediaApiClient } from '../../services/media-api-client.js'

export const MovieLibrariesPage = Shade({
  shadowDomName: 'shade-app-movie-libraries-page',
  render: ({ useDisposable, injector }) => {
    const api = injector.getInstance(MediaApiClient)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const model = modelProvider.getModelForEntityType({
      schemaName: 'MovieLibrary',
      jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/MovieLibrary' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          defaultSettings: {},
          model: MovieLibrary,
          keyProperty: 'id',
          readonlyProperties: [],
          loader: async (findOptions) => {
            const result = await api.call({
              method: 'GET',
              action: '/movie-libraries',
              query: { findOptions },
            })
            return result.result
          },
          deleteEntities: async (id) => {
            await api.call({ method: 'DELETE', action: `/movie-libraries/:id`, url: { id } })
          },
          getEntity: async (id) => {
            const result = await api.call({ method: 'GET', action: `/movie-libraries/:id`, url: { id }, query: {} })
            return result.result
          },
          patchEntity: async (id, entity) => {
            await api.call({
              method: 'PATCH',
              action: `/movie-libraries/:id`,
              url: { id },
              body: entity,
            })
          },
          postEntity: async (entity) => {
            const { result } = await api.call({
              method: 'POST',
              action: `/movie-libraries`,
              body: entity,
            })
            return result
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['icon', 'name']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        model={model}
      />
    )
  },
})
