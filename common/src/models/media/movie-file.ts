import type { FFProbeResult } from 'ffprobe'

export class MovieFile {
  id!: string
  movieId!: string
  driveLetter!: string
  path!: string
  ffprobe?: FFProbeResult | null = null
  relatedFiles?: Array<{
    type: 'subtitle' | 'audio' | 'trailer' | 'info' | 'other'
    path: string
  }>
}
