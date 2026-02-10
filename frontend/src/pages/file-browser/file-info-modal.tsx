import { Shade, createComponent } from '@furystack/shades'
import { Button, Modal, Paper, fadeIn, fadeOut } from '@furystack/shades-common-components'
import type { DirectoryEntry } from 'common'
import { FileIcon } from './file-icon.js'

export const FileInfoModal = Shade<{
  entry: DirectoryEntry
  isInfoVisible: boolean
  onClose: () => void
  currentDriveLetter: string
  currentPath: string
}>({
  shadowDomName: 'file-info-modal',
  css: {
    '& .modal-center': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    },
    '& .modal-content': {
      display: 'flex',
      flexDirection: 'column',
      minWidth: '300px',
    },
    '& .modal-content table': {
      fontWeight: 'lighter',
    },
    '& .button-row': {
      display: 'flex',
      justifyContent: 'flex-end',
    },
  },
  render: ({ props }) => {
    const { entry, isInfoVisible, onClose, currentDriveLetter, currentPath } = props
    return (
      <Modal
        isVisible={isInfoVisible}
        backdropStyle={{
          background: 'rgba(128,128,128, 0.3)',
          backdropFilter: 'blur(5px)',
          zIndex: '2',
        }}
        onClose={onClose}
        showAnimation={fadeIn}
        hideAnimation={fadeOut}
      >
        <div className="modal-center">
          <Paper className="modal-content">
            <h3>
              <FileIcon entry={entry} /> &nbsp;
              {entry.name}
            </h3>

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
                  <td>{entry.isDirectory ? '✅' : '❌'}</td>
                </tr>
                <tr>
                  <td>Is file:</td>
                  <td>{entry.isFile ? '✅' : '❌'}</td>
                </tr>
                <tr>
                  <td>Is block device:</td>
                  <td>{entry.isBlockDevice ? '✅' : '❌'}</td>
                </tr>
                <tr>
                  <td>Is character device:</td>
                  <td>{entry.isCharacterDevice ? '✅' : '❌'}</td>
                </tr>
                <tr>
                  <td>Is FIFO:</td>
                  <td>{entry.isFIFO ? '✅' : '❌'}</td>
                </tr>
                <tr>
                  <td>Is socket:</td>
                  <td>{entry.isSocket ? '✅' : '❌'}</td>
                </tr>
              </tbody>
            </table>

            <div className="button-row">
              <Button onclick={onClose}>Close</Button>
            </div>
          </Paper>
        </div>
      </Modal>
    )
  },
})
