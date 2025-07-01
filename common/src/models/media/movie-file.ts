import type { FfprobeData } from './ffprobe-data.js'

export class MovieFile {
  id!: string
  imdbId?: string
  driveLetter!: string
  path!: string
  ffprobe!: FfprobeData
  relatedFiles?: Array<{
    type: 'subtitle' | 'audio' | 'trailer' | 'info' | 'other'
    path: string
  }>
}
