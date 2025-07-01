import { createComponent } from '@furystack/shades'
import type { ChapterData, FfprobeData } from 'common'

/**
 *
 * @param chapter ChapterData
 * @returns A formatted string, like: "00:00:00.000 --> 00:00:27.500"
 */
const formatTime = (chapter: ChapterData) => {
  const start = chapter.start_time || '0'
  const end = chapter.end_time || '0'
  const startParts = start.split('.')
  const endParts = end.split('.')

  const startSeconds = parseInt(startParts[0], 10)
  const startMilliseconds = parseInt(startParts[1] || '0', 10)
  const endSeconds = parseInt(endParts[0], 10)
  const endMilliseconds = parseInt(endParts[1] || '0', 10)

  return `${String(Math.floor(startSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((startSeconds % 3600) / 60)).padStart(2, '0')}:${String(startSeconds % 60).padStart(2, '0')}.${String(startMilliseconds).padStart(3, '0')} --> ${String(Math.floor(endSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((endSeconds % 3600) / 60)).padStart(2, '0')}:${String(endSeconds % 60).padStart(2, '0')}.${String(endMilliseconds).padStart(3, '0')}`
}

const getChaptersText = (ffprobe: FfprobeData) => {
  const { chapters } = ffprobe
  if (!chapters?.length) {
    return null
  }

  return `
WEBVTT

NOTE Created by Pi-Rat
${chapters
  .map((c, index) => {
    const formattedTime = formatTime(c)
    const chapterTitle = c.tags?.title || `Chapter ${index + 1}`
    return `

${index + 1}
${formattedTime}
${chapterTitle}
`
  })
  .join('')}
`.trim()
}

export const getChaptersBlob = (ffprobe: FfprobeData): Blob | null => {
  const chaptersText = getChaptersText(ffprobe)
  if (!chaptersText) {
    return null
  }
  return new Blob([chaptersText], { type: 'text/vtt' })
}

export const getChaptersTrack = (ffprobe: FfprobeData) => {
  const blob = getChaptersBlob(ffprobe)
  if (!blob) {
    return null
  }
  return <track default kind="chapters" src={URL.createObjectURL(blob)} label="Chapters" />
}
