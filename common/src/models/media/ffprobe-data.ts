interface FfprobeStreamDisposition {
  [key: string]: any
  default?: number | undefined
  dub?: number | undefined
  original?: number | undefined
  comment?: number | undefined
  lyrics?: number | undefined
  karaoke?: number | undefined
  forced?: number | undefined
  hearing_impaired?: number | undefined
  visual_impaired?: number | undefined
  clean_effects?: number | undefined
  attached_pic?: number | undefined
  timed_thumbnails?: number | undefined
}

interface FfprobeStream {
  [key: string]: any
  index: number
  codec_name?: string | undefined
  codec_long_name?: string | undefined
  profile?: number | undefined
  codec_type?: string | undefined
  codec_time_base?: string | undefined
  codec_tag_string?: string | undefined
  codec_tag?: string | undefined
  width?: number | undefined
  height?: number | undefined
  coded_width?: number | undefined
  coded_height?: number | undefined
  has_b_frames?: number | undefined
  sample_aspect_ratio?: string | undefined
  display_aspect_ratio?: string | undefined
  pix_fmt?: string | undefined
  level?: string | undefined
  color_range?: string | undefined
  color_space?: string | undefined
  color_transfer?: string | undefined
  color_primaries?: string | undefined
  chroma_location?: string | undefined
  field_order?: string | undefined
  timecode?: string | undefined
  refs?: number | undefined
  id?: string | undefined
  r_frame_rate?: string | undefined
  avg_frame_rate?: string | undefined
  time_base?: string | undefined
  start_pts?: number | undefined
  start_time?: number | undefined
  duration_ts?: string | undefined
  duration?: string | undefined
  bit_rate?: string | undefined
  max_bit_rate?: string | undefined
  bits_per_raw_sample?: string | undefined
  nb_frames?: string | undefined
  nb_read_frames?: string | undefined
  nb_read_packets?: string | undefined
  sample_fmt?: string | undefined
  sample_rate?: number | undefined
  channels?: number | undefined
  channel_layout?: string | undefined
  bits_per_sample?: number | undefined
  disposition?: FfprobeStreamDisposition | undefined
  rotation?: string | number | undefined
}

interface FfprobeFormat {
  [key: string]: any
  filename?: string | undefined
  nb_streams?: number | undefined
  nb_programs?: number | undefined
  format_name?: string | undefined
  format_long_name?: string | undefined
  start_time?: number | undefined
  duration?: number | undefined
  size?: number | undefined
  bit_rate?: number | undefined
  probe_score?: number | undefined
  tags?: Record<string, string | number> | undefined
}

export type ChapterData = {
  // e.g.: 4866327983123609000
  id: number
  // e.g.: 6000000000
  start: number
  // e.g.: 6.000000
  start_time: string
  // e.g.: 219000000000
  end: number
  // e.g.: 219.000000
  end_time: string
  // e.g.: 1/1000000000
  time_base: string
  tags: {
    // e.g.: "Previously on"
    title: string
  }
}

export interface FfprobeData {
  streams: FfprobeStream[]
  format: FfprobeFormat
  chapters: ChapterData[]
}
