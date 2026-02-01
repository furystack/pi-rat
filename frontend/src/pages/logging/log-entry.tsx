import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '../../components/monaco-editor.js'
import { LoggingService } from '../../services/logging-service.js'

export const LogEntry = Shade<{ id: string }>({
  shadowDomName: 'shade-app-log-entry-page',
  render: ({ props, injector, useObservable }) => {
    const { id } = props
    const loggingService = injector.getInstance(LoggingService)
    const [logEntry] = useObservable('logEntry', loggingService.getLogEntryAsObservable(id))
    return (
      <div style={{ position: 'fixed', top: '60px', left: '0', width: '100%', height: 'calc(100% - 60px)' }}>
        <MonacoEditor
          options={{
            language: 'json',
            readOnly: true,
          }}
          value={JSON.stringify(logEntry.value, null, 2)}
        />
      </div>
    )
  },
})
