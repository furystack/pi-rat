import { createComponent, Shade } from '@furystack/shades'
import { Movie } from 'common'
import mediaSchemas from 'common/schemas/media-entities.json' assert { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'
import { MoviesService } from '../../services/movies-service.js'

export const MoviesPage = Shade({
  shadowDomName: 'shade-app-movies-page',
  render: ({ useDisposable, injector }) => {
    const moviesService = injector.getInstance(MoviesService)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const modelUri = modelProvider.getModelUriForEntityType({
      schemaName: 'Movie',
      jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/Movie' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: Movie,
          keyProperty: 'imdbId',
          readonlyProperties: ['createdAt', 'updatedAt'],
          getEntities: async (findOptions) => {
            const result = await moviesService.findMovie(findOptions)
            return result
          },
          deleteEntities: async (id) => {
            await moviesService.deleteMovie(id)
          },
          getEntity: async (id) => {
            const result = await moviesService.getMovie(id)
            return result
          },
          patchEntity: async (id, entity) => {
            await moviesService.updateMovie(id, entity)
          },
          postEntity: async (entity) => {
            return await moviesService.createMovie(entity)
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['title', 'year', 'type', 'imdbId']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        modelUri={modelUri}
      />
    )
  },
})
