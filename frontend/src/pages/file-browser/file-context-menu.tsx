import { Shade, createComponent } from '@furystack/shades'
import { ContextMenu, ContextMenuManager, Icon, icons, NotyService } from '@furystack/shades-common-components'
import type { ContextMenuItem } from '@furystack/shades-common-components'
import type { DirectoryEntry } from 'common'
import { getFallbackMetadata, getFullPath, isMovieFile, isSampleFile } from 'common'
import { RelatedMoviesModal } from '../../components/movie-file-management/related-movies-modal.js'
import { MediaApiClient } from '../../services/api-clients/media-api-client.js'
import { FileInfoModal } from './file-info-modal.js'

export const FileContextMenu = Shade<{
  entry: DirectoryEntry
  currentDriveLetter: string
  currentPath: string
  open: () => void
}>({
  customElementName: 'file-context-menu',
  render: ({ children, props, useState, injector, useDisposable }) => {
    const { entry, currentDriveLetter, currentPath, open } = props
    const [isInfoVisible, setInfoVisible] = useState('isInfoVisible', false)
    const [isRelatedMoviesVisible, setRelatedMoviesVisible] = useState('isRelatedMoviesVisible', false)

    const manager = useDisposable('contextMenuManager', () => new ContextMenuManager<() => void>())

    const path = `${currentDriveLetter}:${currentPath}/${entry.name}`
    const movieMetadata = props.entry.isFile && !isSampleFile(path) && isMovieFile(path) && getFallbackMetadata(path)

    const allowScanForMovies = props.entry.isDirectory

    const getItems = (): Array<ContextMenuItem<() => void>> => [
      {
        type: 'item',
        icon: <Icon icon={icons.folderOpen} size="small" />,
        label: 'Open',
        data: () => open(),
      },
      ...(movieMetadata
        ? [
            {
              type: 'item' as const,
              icon: <Icon icon={icons.film} size="small" />,
              label: `Related movie: ${movieMetadata.title} ${
                movieMetadata.type === 'episode' ? `S${movieMetadata.season}E${movieMetadata.episode}` : ''
              }`,
              data: () => setRelatedMoviesVisible(true),
            },
            {
              type: 'item' as const,
              icon: <Icon icon={icons.messageCircle} size="small" />,
              label: 'Extract Subtitles',
              data: () => {
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
              type: 'item' as const,
              icon: <Icon icon={icons.film} size="small" />,
              label: 'Scan for movies',
              data: () => {
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
        data: () => setInfoVisible(true),
      },
    ]

    return (
      <>
        <div
          oncontextmenu={(ev: MouseEvent) => {
            ev.preventDefault()
            manager.open({
              position: { x: ev.clientX, y: ev.clientY },
              items: getItems(),
            })
          }}
        >
          {children}
        </div>
        <ContextMenu manager={manager} onItemSelect={(action) => action()} />
        <FileInfoModal
          entry={entry}
          isInfoVisible={isInfoVisible}
          onClose={() => setInfoVisible(false)}
          currentDriveLetter={currentDriveLetter}
          currentPath={currentPath}
        />
        {movieMetadata && (
          <RelatedMoviesModal
            drive={currentDriveLetter}
            path={currentPath}
            file={entry}
            isOpened={isRelatedMoviesVisible}
            onClose={() => setRelatedMoviesVisible(false)}
          />
        )}
      </>
    )
  },
})
