import { createComponent, Shade } from '@furystack/shades'
import { Movie } from 'common'
import mediaSchemas from 'common/schemas/media-entities.json' with { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { MoviesService } from '../../services/movies-service.js'

export const MoviesPage = Shade({
  customElementName: 'shade-app-movies-page',
  render: ({ useDisposable, injector }) => {
    const moviesService = injector.get(MoviesService)

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
          deleteEntities: async (...ids) => {
            await Promise.all(ids.map((id) => moviesService.deleteMovie(id)))
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
        basePath="/entities/movies"
        columns={['title', 'year', 'type', 'imdbId']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        schemaInfo={{
          schemaName: 'Movie',
          jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/Movie' },
        }}
      />
    )
  },
})
