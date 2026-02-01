import type { LogEntry } from '../models/index.js'

export type LogEntryAddedMessage = {
  type: 'log-entry-added'
  logEntry: LogEntry
}
