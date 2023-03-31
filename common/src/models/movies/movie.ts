import type { FFProbeResult } from 'ffprobe'
import type { OmdbMetadata } from './omdb-metadata'
import type { MovieUniversalMetadata } from './movie-universal-metadata'
import type { EncodingType } from './movie-library'

export class Movie {
  _id!: string
  volumeLetter!: string
  path!: string
  libraryId!: string
  omdbMeta?: OmdbMetadata
  ffprobe!: FFProbeResult
  metadata!: MovieUniversalMetadata
  availableFormats?: Array<{ codec: EncodingType['codec']; mode: EncodingType['mode'] }>
}
