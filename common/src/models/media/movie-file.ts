import type { FFProbeResult } from 'ffprobe'

export class MovieFile {
  imdbId!: string
  driveLetter!: string
  path!: string
  fileName!: string
  ffprobe?: FFProbeResult | null = null
  relatedFiles?: Array<{
    type: 'subtitle' | 'audio' | 'trailer' | 'info' | 'other'
    path: string
  }>
}
