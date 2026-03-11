import { createComponent } from '@furystack/shades'
import type { ContextMenuItem } from '@furystack/shades-common-components'
import { Icon, icons, type NotyService } from '@furystack/shades-common-components'
import { getFallbackMetadata, getFullPath, isMovieFile, isSampleFile, type DirectoryEntry } from 'common'

import type { MediaApiClient } from '../../services/api-clients/media-api-client.js'

type ContextMenuDeps = {
  currentDriveLetter: string
  currentPath: string
  mediaApiClient: MediaApiClient
  notyService: NotyService
  onActivate?: (entry: DirectoryEntry) => void
  onShowRelatedMovies: () => void
  onShowFileInfo: () => void
  onDeleteRequest: () => void
}

export const getContextMenuItems = (
  entry: DirectoryEntry,
  deps: ContextMenuDeps,
): Array<ContextMenuItem<() => void>> => {
  const { currentDriveLetter, currentPath, mediaApiClient, notyService } = deps

  const path = `${currentDriveLetter}:${currentPath}/${entry.name}`
  const movieMetadata = entry.isFile && !isSampleFile(path) && isMovieFile(path) && getFallbackMetadata(path)
  const allowScanForMovies = entry.isDirectory

  return [
    {
      type: 'item',
      icon: <Icon icon={icons.folderOpen} size="small" />,
      label: 'Open',
      data: () => deps.onActivate?.(entry),
    },
    ...(movieMetadata
      ? [
          {
            type: 'item' as const,
            icon: <Icon icon={icons.film} size="small" />,
            label: `Related movie: ${movieMetadata.title} ${
              movieMetadata.type === 'episode' ? `S${movieMetadata.season}E${movieMetadata.episode}` : ''
            }`,
            data: () => deps.onShowRelatedMovies(),
          },
          {
            type: 'item' as const,
            icon: <Icon icon={icons.messageCircle} size="small" />,
            label: 'Extract Subtitles',
            data: () => {
              mediaApiClient
                .call({
                  method: 'POST',
                  action: '/extract-subtitles',
                  body: {
                    driveLetter: currentDriveLetter,
                    path: getFullPath(currentPath, entry.name),
                  },
                })
                .then(() => {
                  notyService.emit('onNotyAdded', {
                    type: 'success',
                    title: 'Subtitles extracted',
                    body: <>Subtitles extracted successfully for file {entry.name}</>,
                  })
                })
                .catch(() => {
                  notyService.emit('onNotyAdded', {
                    type: 'error',
                    title: 'Subtitles extraction failed',
                    body: <>Subtitles extraction failed for file {entry.name}</>,
                  })
                })
            },
          },
        ]
      : []),
    ...(allowScanForMovies
      ? [
          {
            type: 'item' as const,
            icon: <Icon icon={icons.film} size="small" />,
            label: 'Scan for movies',
            data: () => {
              mediaApiClient
                .call({
                  method: 'POST',
                  action: '/scan-for-movies',
                  body: {
                    root: {
                      driveLetter: currentDriveLetter,
                      path: getFullPath(currentPath, entry.name),
                    },
                    autoExtractSubtitles: false,
                  },
                })
                .then(() => {
                  notyService.emit('onNotyAdded', {
                    type: 'success',
                    title: 'Movies scanned',
                    body: <>Movies scanned successfully for folder {entry.name}</>,
                  })
                })
                .catch(() => {
                  notyService.emit('onNotyAdded', {
                    type: 'error',
                    title: 'Movies scanning failed',
                    body: <>Movies scanning failed for folder {entry.name}</>,
                  })
                })
            },
          },
        ]
      : []),
    {
      type: 'item',
      icon: <Icon icon={icons.info} size="small" />,
      label: 'Show file info',
      data: () => deps.onShowFileInfo(),
    },
    ...(entry.name !== '..'
      ? [
          {
            type: 'separator' as const,
          },
          {
            type: 'item' as const,
            icon: <Icon icon={icons.trash} size="small" />,
            label: 'Delete',
            data: () => deps.onDeleteRequest(),
          },
        ]
      : []),
  ]
}
