import { createComponent, Shade } from '@furystack/shades'
import { LogEntry } from 'common'
import loggingSchemas from 'common/schemas/logging-entities.json' with { type: 'json' }
import { GenericEditorService } from '../../components/generic-editor/generic-editor-service.js'
import { GenericEditor } from '../../components/generic-editor/index.js'
import { LoggingService } from '../../services/logging-service.js'
import { MonacoModelProvider } from '../../services/monaco-model-provider.js'

export const LoggingPage = Shade({
  shadowDomName: 'shade-app-logging-page',
  render: ({ useDisposable, injector }) => {
    const loggingService = injector.getInstance(LoggingService)

    const modelProvider = injector.getInstance(MonacoModelProvider)

    const modelUri = modelProvider.getModelUriForEntityType({
      schemaName: 'LoggingService',
      jsonSchema: { ...loggingSchemas, type: 'object', $ref: '#/definitions/LogEntry' },
    })

    const service = useDisposable(
      'service',
      () =>
        new GenericEditorService({
          model: LogEntry,
          keyProperty: 'id',
          readonlyProperties: [],
          deleteEntities: async () => {
            throw new Error('Delete not supported for logging entries')
          },
          getEntity: async (id) => {
            const result = await loggingService.getLogEntry(id)
            return result
          },
          getEntities: async (findOptions) => {
            const result = await loggingService.findLogEntry(findOptions)
            return result
          },
          patchEntity: async () => {
            throw new Error('Patch not supported for logging entries')
          },
          postEntity: async () => {
            throw new Error('Post not supported for logging entries')
          },
        }),
    )
    return (
      <GenericEditor
        service={service}
        columns={['createdAt', 'scope', 'message', 'level']}
        headerComponents={{}}
        styles={{}}
        rowComponents={{}}
        modelUri={modelUri}
      />
    )
  },
})
