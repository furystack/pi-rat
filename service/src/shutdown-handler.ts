import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'
import { ServerManager } from '@furystack/rest-service'

export const attachShutdownHandler = (i: Injector): void => {
  const logger = getLogger(i).withScope('shutdown-handler')

  logger.information({ message: '💤  Attaching shutdown handler...' })

  const onExit = async ({ code, reason, error }: { code: number; reason: string; error?: any }) => {
    process.removeAllListeners('exit')
    try {
      if (code) {
        await logger.fatal({
          message: `Something bad happened, starting shutdown with code '${code}' due '${reason}'`,
          data: {
            code,
            reason,
            error,
            errorMessage: error?.message,
            errorStack: error?.stack,
          },
        })
      } else {
        await logger.information({
          message: `Shutting down gracefully due '${reason}'`,
          data: {
            code,
            reason,
            error,
          },
        })
      }
      if (i.cachedSingletons.get(ServerManager)) {
        await i.getInstance(ServerManager)[Symbol.asyncDispose]()
      }
      await i[Symbol.asyncDispose]()
    } catch (e) {
      console.error('Error during shutdown', e)
      process.exit(1)
    }
    process.exit(code)
  }

  process.once('exit', () => onExit({ code: 0, reason: 'exit' }))

  // catches ctrl+c event
  process.once('SIGINT', () => onExit({ code: 0, reason: 'SIGINT' }))
  process.once('SIGQUIT', () => onExit({ code: 0, reason: 'SIGQUIT' }))
  process.once('SIGTERM', () => onExit({ code: 0, reason: 'SIGTERM' }))

  // catches "kill pid" (for example: nodemon restart)
  process.once('SIGUSR1', () => onExit({ code: 0, reason: 'SIGUSR1' }))
  process.once('SIGUSR2', () => onExit({ code: 0, reason: 'SIGUSR2' }))

  // catches uncaught exceptions
  process.once('uncaughtException', (error) => {
    onExit({ code: 1, reason: 'uncaughtException', error })
  })

  process.once('unhandledRejection', (error) => onExit({ code: 1, reason: 'unhandledRejection', error }))
}
