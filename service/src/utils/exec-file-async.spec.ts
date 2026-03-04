import { describe, expect, it, vi } from 'vitest'
import { execFileAsync } from './exec-file-async.js'

vi.mock('child_process', () => ({
  execFile: vi.fn(
    (
      command: string,
      args: string[],
      callback: (err: Error | null, stdout: string | Buffer, stderr: string | Buffer) => void,
    ) => {
      if (command === 'echo' && args[0] === 'hello') {
        callback(null, '  hello  ', '')
        return
      }
      if (command === 'failing-command') {
        callback(new Error('Command failed'), '', 'error output')
        return
      }
      callback(null, '', '')
    },
  ),
}))

describe('execFileAsync', () => {
  it('should resolve with trimmed stdout on success', async () => {
    const result = await execFileAsync('echo', ['hello'])
    expect(result).toBe('hello')
  })

  it('should resolve with empty string when stdout is empty', async () => {
    const result = await execFileAsync('other', [])
    expect(result).toBe('')
  })

  it('should reject with the error when the command fails', async () => {
    await expect(execFileAsync('failing-command', [])).rejects.toThrow('Command failed')
  })
})
