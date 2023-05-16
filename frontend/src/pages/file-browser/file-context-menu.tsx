import { Shade, createComponent } from '@furystack/shades'
import { ContextMenu } from '../../components/context-menu.js'
import type { DirectoryEntry } from 'common'
import { ObservableValue } from '@furystack/utils'
import { FileInfoModal } from './file-info-modal.js'

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

    return (
      <>
        <ContextMenu
          items={[
            {
              icon: '',
              label: 'Open',
              onClick: () => {
                open()
              },
            },
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
      </>
    )
  },
})
