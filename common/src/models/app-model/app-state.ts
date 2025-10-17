export type AppStateType = 'running' | 'stopped' | 'initializing' | 'error'

export type AppState =
  | {
      type: 'running'
      lastHealthCheck: Date
    }
  | {
      type: 'stopped'
      reason: string
    }
  | {
      type: 'initializing'
    }
  | {
      type: 'error'
      error: string
    }
