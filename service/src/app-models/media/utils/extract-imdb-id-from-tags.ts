const IMDB_ID_PATTERN = /^tt\d{7,}$/

export const extractImdbIdFromFfprobeTags = (tags: unknown): string | undefined => {
  if (!tags || typeof tags !== 'object') return undefined
  const record = tags as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (/^imdb[_-]?id$/i.test(key) || /^imdb$/i.test(key)) {
      const value = String(record[key]).trim()
      if (IMDB_ID_PATTERN.test(value)) return value
    }
  }
  return undefined
}
