import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '../../components/monaco-editor.js'
import { LoggingService } from '../../services/logging-service.js'

export const LogEntry = Shade<{ id: string }>({
  shadowDomName: 'shade-app-log-entry-page',
  css: {
    '& .log-entry-container': {
      position: 'fixed',
      top: '60px',
      left: '0',
      width: '100%',
      height: 'calc(100% - 60px)',
    },
  },
  render: ({ props, injector, useObservable }) => {
    const { id } = props
    const loggingService = injector.getInstance(LoggingService)
    const [logEntry] = useObservable('logEntry', loggingService.getLogEntryAsObservable(id))
    return (
      <div className="log-entry-container">
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
