import { createComponent, Shade } from '@furystack/shades'
import { MovieFile } from 'common'
import mediaSchemas from 'common/schemas/media-entities.json' assert { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'
import { MovieFilesService } from '../../services/movie-files-service.js'

export const MovieFilesPage = Shade({
  shadowDomName: 'shade-app-movie-files-page',
  render: ({ useDisposable, injector }) => {
    const movieFilesService = injector.getInstance(MovieFilesService)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const modelUri = modelProvider.getModelUriForEntityType({
      schemaName: 'MovieFile',
      jsonSchema: { ...mediaSchemas, type: 'object', $ref: '#/definitions/MovieFile' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: MovieFile,
          keyProperty: 'id',
          readonlyProperties: [],
          getEntities: async (findOptions) => await movieFilesService.findMovieFile(findOptions),
          deleteEntities: async (id) => await movieFilesService.deleteMovieFile(id),
          getEntity: async (id) => await movieFilesService.getMovieFile(id),
          patchEntity: async (id, entity) => {
            await movieFilesService.updateMovieFile(id, entity)
          },
          postEntity: async (entity) => await movieFilesService.createMovieFile(entity),
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['driveLetter', 'path', 'imdbId']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        modelUri={modelUri}
      />
    )
  },
})
