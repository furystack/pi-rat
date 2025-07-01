import { Shade, createComponent } from '@furystack/shades'
import { NotyService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import type { DirectoryEntry } from 'common'
import { getFallbackMetadata, getFullPath, isMovieFile, isSampleFile } from 'common'
import { ContextMenu } from '../../components/context-menu.js'
import { RelatedMoviesModal } from '../../components/movie-file-management/related-movies-modal.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'
import { FileInfoModal } from './file-info-modal.js'

export const FileContextMenu = Shade<{
  entry: DirectoryEntry
  currentDriveLetter: string
  currentPath: string
  open: () => void
}>({
  shadowDomName: 'file-context-menu',
  render: ({ children, props, useDisposable, injector }) => {
    const { entry, currentDriveLetter, currentPath, open } = props
    const isInfoVisible = useDisposable('isInfoVisible', () => new ObservableValue(false))
    const isRelatedMoviesVisible = useDisposable('isRelatedMoviesVisible', () => new ObservableValue(false))

    const path = `${currentDriveLetter}:${currentPath}/${entry.name}`
    const movieMetadata = props.entry.isFile && !isSampleFile(path) && isMovieFile(path) && getFallbackMetadata(path)

    const allowScanForMovies = props.entry.isDirectory

    return (
      <>
        <ContextMenu
          items={[
            {
              icon: { type: 'font', value: '📂' },
              label: 'Open',
              onClick: () => {
                open()
              },
            },

            ...(movieMetadata
              ? [
                  {
                    icon: { type: 'font', value: '🎥' } as const,
                    label: `Related movie: ${movieMetadata.title} ${
                      movieMetadata.type === 'episode' ? `S${movieMetadata.season}E${movieMetadata.episode}` : ''
                    }`,
                    onClick: () => {
                      isRelatedMoviesVisible.setValue(true)
                    },
                  },
                  {
                    icon: { type: 'font', value: '💬' } as const,
                    label: 'Extract Subtitles',
                    onClick: () => {
                      const notyService = injector.getInstance(NotyService)
                      injector
                        .getInstance(MediaApiClient)
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
                    icon: { type: 'font', value: '🎬' } as const,
                    label: 'Scan for movies',
                    onClick: () => {
                      const notyService = injector.getInstance(NotyService)
                      injector
                        .getInstance(MediaApiClient)
                        .call({
                          method: 'POST',
                          action: '/scan-for-movies',
                          body: {
                            root: {
                              driveLetter: currentDriveLetter,
                              path: getFullPath(currentPath, entry.name),
                            },
                            autoExtractSubtitles: true,
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
              icon: { type: 'font', value: 'ℹ️' } as const,
              label: 'Show file info',
              onClick: () => {
                isInfoVisible.setValue(true)
              },
            },
          ]}
        >
          {children}
        </ContextMenu>
        <FileInfoModal
          entry={entry}
          isInfoVisible={isInfoVisible}
          currentDriveLetter={currentDriveLetter}
          currentPath={currentPath}
        />
        {movieMetadata && (
          <RelatedMoviesModal
            drive={currentDriveLetter}
            path={currentPath}
            file={entry}
            isOpened={isRelatedMoviesVisible}
          />
        )}
      </>
    )
  },
})
