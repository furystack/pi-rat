import { Shade, createComponent } from '@furystack/shades'
import { ContextMenu } from '../../components/context-menu.js'
import type { DirectoryEntry } from 'common'
import { isMovieFile, getFallbackMetadata } from 'common'
import { ObservableValue } from '@furystack/utils'
import { FileInfoModal } from './file-info-modal.js'
import { RelatedMoviesModal } from '../../components/movie-file-management/related-movies-modal.js'

export const FileContextMenu = Shade<{
  entry: DirectoryEntry
  currentDriveLetter: string
  currentPath: string
  open: () => void
}>({
  shadowDomName: 'file-context-menu',
  render: ({ children, props, useDisposable }) => {
    const { entry, currentDriveLetter, currentPath, open } = props
    const isInfoVisible = useDisposable('isInfoVisible', () => new ObservableValue(false))
    const isRelatedMoviesVisible = useDisposable('isRelatedMoviesVisible', () => new ObservableValue(false))

    const path = `${currentDriveLetter}:${currentPath}/${entry.name}`
    const movieMetadata = props.entry.isFile && isMovieFile(path) && getFallbackMetadata(path)

    return (
      <>
        <ContextMenu
          items={[
            {
              icon: '📂',
              label: 'Open',
              onClick: () => {
                open()
              },
            },

            ...(movieMetadata
              ? [
                  {
                    icon: '🎥',
                    label: `Related Movies (${movieMetadata.title})`,
                    onClick: () => {
                      isRelatedMoviesVisible.setValue(true)
                    },
                  },
                ]
              : []),
            {
              icon: 'ℹ️',
              label: 'Show file info',
              onClick: () => {
                isInfoVisible.setValue(true)
              },
            },
          ]}>
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
