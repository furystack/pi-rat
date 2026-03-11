import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const IMDB_ID_IN_CONTENT = /tt\d{7,}/

export const extractImdbIdFromNfoFiles = async (
  physicalParentPath: string,
  relativeParentPath: string,
): Promise<{ imdbId?: string; nfoFiles: string[] }> => {
  let entries: string[]
  try {
    const dirEntries = await readdir(physicalParentPath)
    entries = dirEntries.filter((name) => name.toLowerCase().endsWith('.nfo'))
  } catch {
    return { nfoFiles: [] }
  }

  if (entries.length === 0) {
    return { nfoFiles: [] }
  }

  const nfoFiles = entries.map((name) => join(relativeParentPath, name).split('\\').join('/'))

  for (const name of entries) {
    try {
      const content = await readFile(join(physicalParentPath, name), 'utf-8')
      const match = IMDB_ID_IN_CONTENT.exec(content)
      if (match) {
        return { imdbId: match[0], nfoFiles }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return { nfoFiles }
}
