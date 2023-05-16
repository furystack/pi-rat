export class FallbackMetadata {
  title!: string
  year?: number
  duration?: number
  genre!: string[]
  thumbnailImageUrl!: string
  plot!: string
  type!: 'movie' | 'episode'
  seriesId?: string
  season?: number
  episode?: number
}

const getYear = (segment: string) => {
  const yearStr = segment.split(/['.'|' ']/).find((v) => {
    const no = parseInt(v, 10)
    return (no > 1900 && no < new Date().getFullYear()) || false
  })
  return (yearStr && parseInt(yearStr, 10)) || undefined
}

const getResolution = (segment: string) => new RegExp(/\.(?<resolution>(\d+p))\./gm).exec(segment)?.groups?.resolution

export const getFallbackMetaWithScore = (segment: string): { meta: FallbackMetadata; score: number } => {
  if (!segment) {
    return {
      score: -1,
      meta: {
        title: '',
        genre: [],
        thumbnailImageUrl: '',
        plot: '',
        type: 'movie',
      },
    }
  }

  const year = getYear(segment)
  const resolution = getResolution(segment)
  const title = segment
    .split(new RegExp(`(${year}|${resolution}|(.S[0-9]+E[0-9]+.))`))[0]
    .split(/['.'|' ']/g)
    .join(' ')
    .trim()

  const { season, episode } =
    new RegExp(/\.S(?<season>\d+)E(?<episode>\d+)\./gm).exec(segment)?.groups ||
    ({} as { [K: string]: string | undefined })

  const score = [year, resolution, season, episode].filter((a) => a).length

  return {
    score,
    meta: {
      title,
      year,
      genre: [],
      duration: 0,
      thumbnailImageUrl: '',
      plot: '',
      ...(season && episode
        ? {
            type: 'episode',
            season: parseInt(season, 10),
            episode: parseInt(episode, 10),
          }
        : {
            type: 'movie',
          }),
    },
  }
}

export const getFallbackMetadata = (path: string): FallbackMetadata => {
  const segments = path.split(/\/|\\/g)
  const fileName = segments[segments.length - 1]
  const folderName = segments[segments.length - 2]

  const fileNameWithScore = getFallbackMetaWithScore(fileName)
  const folderNameWithScore = getFallbackMetaWithScore(folderName)

  return fileNameWithScore.score > folderNameWithScore.score ? fileNameWithScore.meta : folderNameWithScore.meta
}
