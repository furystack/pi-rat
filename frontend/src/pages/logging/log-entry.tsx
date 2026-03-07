import { useEntitySync } from '@furystack/entity-sync-client'
import { createComponent, Shade } from '@furystack/shades'
import { Skeleton } from '@furystack/shades-common-components'
import { LogEntry as LogEntryModel } from 'common'
import { GenericErrorPage } from '../../components/generic-error.js'
import { LazyMonacoEditor } from '../../components/lazy-monaco-editor.js'

export const LogEntry = Shade<{ id: string }>({
  customElementName: 'shade-app-log-entry-page',
  css: {
    '& .log-entry-container': {
      position: 'fixed',
      top: '60px',
      left: '0',
      width: '100%',
      height: 'calc(100% - 60px)',
    },
  },
  render: (options) => {
    const { id } = options.props
    const logEntryState = useEntitySync(options, LogEntryModel, id)

    if (logEntryState.status === 'connecting') {
      return <Skeleton />
    }

    if (logEntryState.status === 'error') {
      return <GenericErrorPage error={logEntryState.error} />
    }

    return (
      <div className="log-entry-container">
        <LazyMonacoEditor language="json" readOnly value={JSON.stringify(logEntryState.data, null, 2)} />
      </div>
    )
  },
})
