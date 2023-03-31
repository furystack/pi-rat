export type Vp9EncodingType = {
  mode: 'dash'
  codec: 'libvpx-vp9'
  formats: Vp9EncodingFormat[]
}

export type X264EncodingType = {
  mode: 'dash'
  codec: 'x264'
  formats: X264EncodingFormat[]
}

export type EncodingType = Vp9EncodingType | X264EncodingType

export type X264EncodingFormat = {
  downScale: number
  bitRate: number
}

export type Vp9EncodingFormat = { downScale?: number } & {
  bitrate?: {
    target?: number
    min?: number
    max?: number
  }
  quality?: number
}

export class MovieLibrary {
  _id!: string
  icon!: string
  name!: string
  path!: string
  owner!: string
  encoding!: EncodingType | false
  autoCreateEncodingTasks?: boolean
  autoExtractSubtitles?: boolean
}

export const defaultX264Encoding: EncodingType = {
  mode: 'dash',
  codec: 'x264',
  formats: [
    { downScale: 480, bitRate: 2500 },
    { downScale: 720, bitRate: 6000 },
    { downScale: 1080, bitRate: 12000 },
  ],
}

export const defaultVp9Encoding: EncodingType = {
  mode: 'dash',
  codec: 'libvpx-vp9',
  formats: [
    {
      downScale: 240,
      quality: 37,
      bitrate: {
        min: 75,
        target: 218,
        max: 150,
      },
    },
    {
      downScale: 480,
      quality: 32,
      bitrate: {
        min: 256,
        target: 521,
        max: 742,
      },
    },
    {
      downScale: 720,
      quality: 32,
      bitrate: {
        min: 900,
        target: 1800,
        max: 2610,
      },
    },
    {
      downScale: 1080,
      quality: 10,
      bitrate: {
        min: 8000,
        target: 12000,
        max: 15000,
      },
    },
  ],
}

export const defaultEncoding: EncodingType = defaultX264Encoding
