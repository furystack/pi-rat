import { access } from 'fs/promises'

export const existsAsync = async (path: string, mode?: number) => {
  try {
    await access(path, mode)
  } catch {
    return false
  }
  return true
}
