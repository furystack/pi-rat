import { Shade, createComponent } from '@furystack/shades'
import { Button, Modal, Paper, fadeIn, fadeOut } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'
import type { DirectoryEntry } from 'common'
import { getFallbackMetadata } from 'common'
import { FileIcon } from '../../pages/file-browser/file-icon.js'
import { Separator } from '../Separator.js'
import { RelatedMoviesModalContent } from './related-movies-modal-content.js'

interface ManageMovieModalProps {
  isOpened: ObservableValue<boolean>
  file: DirectoryEntry
  drive: string
  path: string
}

export const RelatedMoviesModal = Shade<ManageMovieModalProps>({
  shadowDomName: 'shade-app-manage-movie-modal',
  render: ({ props }) => {
    const { isOpened, drive, file, path } = props

    const fallbackMeta = getFallbackMetadata(`${path}/${file.name}`)

    return (
      <Modal
        isVisible={isOpened}
        backdropStyle={{
          background: 'rgba(128,128,128, 0.3)',
          backdropFilter: 'blur(5px)',
          zIndex: '2',
        }}
        onClose={() => isOpened.setValue(false)}
        showAnimation={fadeIn}
        hideAnimation={fadeOut}>
        <div
          onclick={(ev) => ev.stopPropagation()}
          ondblclick={(ev) => ev.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
          <Paper style={{ display: 'flex', flexDirection: 'column', minWidth: '300px', fontWeight: 'lighter' }}>
            <div>
              <h3 style={{ marginBottom: '0' }}>
                <FileIcon entry={file} /> &nbsp;{fallbackMeta.title} ({fallbackMeta.year})
              </h3>
              <div
                style={{
                  padding: '0.5em 0.5em 0 0.7em',
                  fontSize: '0.85em',
                  color: 'rgba(128,128,128,0.8)',
                }}>{`${path === '/' ? '' : path}/${file.name}`}</div>
            </div>

            <Separator />
            <RelatedMoviesModalContent drive={drive} path={path} file={file} />
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button onclick={() => isOpened.setValue(false)}>Close</Button>
            </div>
          </Paper>
        </div>
      </Modal>
    )
  },
})
