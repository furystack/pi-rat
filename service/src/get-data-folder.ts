import { join } from 'path'

export const getDataFolder = (env = process.env) => {
  return env.DATA_FOLDER || join(process.cwd(), 'data')
}
