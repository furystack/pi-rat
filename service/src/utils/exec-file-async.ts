import { execFile } from 'child_process'

export const execFileAsync = async (command: string, args: string[]) => {
  return await new Promise<string>((resolve, reject) =>
    execFile(command, args, (err, stdout, _stderr) => {
      if (err) {
        reject(err instanceof Error ? err : new Error(JSON.stringify(err)))
      } else {
        resolve(stdout.toString().trim())
      }
    }),
  )
}
