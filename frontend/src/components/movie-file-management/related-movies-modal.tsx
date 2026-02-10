import { Shade, createComponent } from '@furystack/shades'
import { Button, Modal, Paper, fadeIn, fadeOut } from '@furystack/shades-common-components'
import type { DirectoryEntry } from 'common'
import { getFallbackMetadata } from 'common'
import { FileIcon } from '../../pages/file-browser/file-icon.js'
import { Divider } from '@furystack/shades-common-components'
import { RelatedMoviesModalContent } from './related-movies-modal-content.js'

type ManageMovieModalProps = {
  isOpened: boolean
  onClose: () => void
  file: DirectoryEntry
  drive: string
  path: string
}

export const RelatedMoviesModal = Shade<ManageMovieModalProps>({
  shadowDomName: 'shade-app-manage-movie-modal',
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
      fontWeight: 'lighter',
    },
    '& .modal-title': {
      marginBottom: '0',
    },
    '& .file-path': {
      padding: '0.5em 0.5em 0 0.7em',
      fontSize: '0.85em',
      color: 'rgba(128,128,128,0.8)',
    },
    '& .button-row': {
      display: 'flex',
      justifyContent: 'flex-end',
    },
  },
  render: ({ props }) => {
    const { isOpened, onClose, drive, file, path } = props

    const fallbackMeta = getFallbackMetadata(`${path}/${file.name}`)

    return (
      <Modal
        isVisible={isOpened}
        backdropStyle={{
          background: 'rgba(128,128,128, 0.3)',
          backdropFilter: 'blur(5px)',
          zIndex: '2',
        }}
        onClose={onClose}
        showAnimation={fadeIn}
        hideAnimation={fadeOut}
      >
        <div className="modal-center" onclick={(ev) => ev.stopPropagation()} ondblclick={(ev) => ev.stopPropagation()}>
          <Paper className="modal-content">
            <div>
              <h3 className="modal-title">
                <FileIcon entry={file} /> &nbsp;{fallbackMeta.title}
                {fallbackMeta.year && ` (${fallbackMeta.year})`}
              </h3>
              <div className="file-path">{`${path === '/' ? '' : path}/${file.name}`}</div>
            </div>

            <Divider />
            <RelatedMoviesModalContent drive={drive} path={path} file={file} />
            <div className="button-row">
              <Button onclick={onClose}>Close</Button>
            </div>
          </Paper>
        </div>
      </Modal>
    )
  },
})
