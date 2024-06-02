import type { FFProbeResult } from 'ffprobe'

export class MovieFile {
  id!: string
  imdbId?: string
  driveLetter!: string
  path!: string
  fileName!: string
  ffprobe!: FFProbeResult
  relatedFiles?: Array<{
    type: 'subtitle' | 'audio' | 'trailer' | 'info' | 'other'
    path: string
  }>
}
