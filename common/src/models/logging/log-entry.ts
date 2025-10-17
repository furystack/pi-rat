import type { LeveledLogEntry, LogLevel } from '@furystack/logging'

/**
 * A log entry model
 */
export class LogEntry implements LeveledLogEntry<unknown> {
  /**
   * The unique identifier of the log entry
   */
  id!: string
  /**
   * The scope of the log entry
   */
  scope!: string
  /**
   * A short message describing the log entry
   */
  message!: string
  /**
   * Additional structured data
   */
  data?: unknown
  /**
   * The log level
   */
  level!: LogLevel

  /**
   * The creation timestamp
   */
  createdAt!: string
}
