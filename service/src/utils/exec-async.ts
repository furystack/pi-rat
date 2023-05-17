import type { ExecOptions } from 'child_process'
import { exec } from 'child_process'

export const execAsync = async (command: string, options: ExecOptions) => {
  return await new Promise<string>((resolve, reject) =>
    exec(command, { ...options }, (err, stdout, _stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve(stdout)
      }
    }),
  )
}
