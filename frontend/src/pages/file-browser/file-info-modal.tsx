import { Shade, createComponent } from '@furystack/shades'
import { Button, Dialog, Icon, icons } from '@furystack/shades-common-components'
import type { DirectoryEntry } from 'common'

export const FileInfoModal = Shade<{
  entry: DirectoryEntry
  isInfoVisible: boolean
  onClose: () => void
  currentDriveLetter: string
  currentPath: string
}>({
  shadowDomName: 'file-info-modal',
  css: {
    '& table': {
      fontWeight: 'lighter',
    },
  },
  render: ({ props }) => {
    const { entry, isInfoVisible, onClose, currentDriveLetter, currentPath } = props
    return (
      <Dialog
        isVisible={isInfoVisible}
        title={entry.name}
        onClose={onClose}
        actions={<Button onclick={onClose}>Close</Button>}
      >
        <table>
          <tbody>
            <tr>
              <td>Drive</td>
              <td>{currentDriveLetter}</td>
            </tr>
            <tr>
              <td>Path</td>
              <td>{currentPath}</td>
            </tr>
            <tr>
              <td>Is directory:</td>
              <td>
                {entry.isDirectory ? (
                  <Icon icon={icons.check} size="small" color="success" />
                ) : (
                  <Icon icon={icons.close} size="small" color="error" />
                )}
              </td>
            </tr>
            <tr>
              <td>Is file:</td>
              <td>
                {entry.isFile ? (
                  <Icon icon={icons.check} size="small" color="success" />
                ) : (
                  <Icon icon={icons.close} size="small" color="error" />
                )}
              </td>
            </tr>
            <tr>
              <td>Is block device:</td>
              <td>
                {entry.isBlockDevice ? (
                  <Icon icon={icons.check} size="small" color="success" />
                ) : (
                  <Icon icon={icons.close} size="small" color="error" />
                )}
              </td>
            </tr>
            <tr>
              <td>Is character device:</td>
              <td>
                {entry.isCharacterDevice ? (
                  <Icon icon={icons.check} size="small" color="success" />
                ) : (
                  <Icon icon={icons.close} size="small" color="error" />
                )}
              </td>
            </tr>
            <tr>
              <td>Is FIFO:</td>
              <td>
                {entry.isFIFO ? (
                  <Icon icon={icons.check} size="small" color="success" />
                ) : (
                  <Icon icon={icons.close} size="small" color="error" />
                )}
              </td>
            </tr>
            <tr>
              <td>Is socket:</td>
              <td>
                {entry.isSocket ? (
                  <Icon icon={icons.check} size="small" color="success" />
                ) : (
                  <Icon icon={icons.close} size="small" color="error" />
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </Dialog>
    )
  },
})
