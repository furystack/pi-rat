import type { Injector } from '@furystack/inject'
import { getLogger } from '@furystack/logging'

type ExitDetails = { code: number; reason: string; error?: unknown }

export const attachShutdownHandler = async (i: Injector) => {
  const logger = getLogger(i).withScope('shutdown-handler')

  await logger.information({ message: '💤  Attaching shutdown handler...' })

  const onExit = async ({ code, reason, error }: ExitDetails) => {
    process.removeAllListeners('exit')
    try {
      if (code) {
        const errorMessage = error instanceof Error ? error.message : undefined
        const errorStack = error instanceof Error ? error.stack : undefined
        await logger.fatal({
          message: `Something bad happened, starting shutdown with code '${code}' due '${reason}'`,
          data: { code, reason, error, errorMessage, errorStack },
        })
      } else {
        await logger.information({
          message: `Shutting down gracefully due '${reason}'`,
          data: { code, reason, error },
        })
      }
      await i[Symbol.asyncDispose]()
    } catch (e) {
      console.error('Error during shutdown', e)
      process.exit(1)
    }
    process.exit(code)
  }

  process.once('exit', () => void onExit({ code: 0, reason: 'exit' }))
  process.once('SIGINT', () => void onExit({ code: 0, reason: 'SIGINT' }))
  process.once('SIGQUIT', () => void onExit({ code: 0, reason: 'SIGQUIT' }))
  process.once('SIGTERM', () => void onExit({ code: 0, reason: 'SIGTERM' }))
  process.once('SIGUSR1', () => void onExit({ code: 0, reason: 'SIGUSR1' }))
  process.once('SIGUSR2', () => void onExit({ code: 0, reason: 'SIGUSR2' }))
  process.once('uncaughtException', (error) => void onExit({ code: 1, reason: 'uncaughtException', error }))
  process.once('unhandledRejection', (error) => void onExit({ code: 1, reason: 'unhandledRejection', error }))
}
