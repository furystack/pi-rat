import { Shade, createComponent } from '@furystack/shades'
import { Button, Modal, Paper, fadeIn, fadeOut } from '@furystack/shades-common-components'
import type { ObservableValue } from '@furystack/utils'
import type { DirectoryEntry } from 'common'
import { getFallbackMetadata, isMovieFile } from 'common'
import { MoviesService } from '../../services/movies-service.js'
import { FileIcon } from '../../pages/file-browser/file-icon.js'
import { MovieStatus } from './movie-status.js'

interface ManageMovieModalProps {
  isOpened: ObservableValue<boolean>
  file: DirectoryEntry
  drive: string
  path: string
}

export const ManageMovieModal = Shade<ManageMovieModalProps>({
  shadowDomName: 'shade-app-manage-movie-modal',
  render: ({ props, injector, useObservable }) => {
    const { isOpened, drive, file, path } = props

    const fullPath = `${drive}:${path}/${file.name}`
    const movieMetadata = isMovieFile(fullPath) && getFallbackMetadata(fullPath)

    if (!movieMetadata) return null

    const movieService = injector.getInstance(MoviesService)
    const [movieStatus] = useObservable(
      'movieStatus',
      movieService.findMovieAsObservable({
        filter: {
          title: { $eq: movieMetadata.title },
          year: movieMetadata.year ? { $eq: movieMetadata.year } : undefined,
          type: movieMetadata.type ? { $eq: movieMetadata.type } : undefined,
          season: movieMetadata.season ? { $eq: movieMetadata.season } : undefined,
          episode: movieMetadata.episode ? { $eq: movieMetadata.episode } : undefined,
        },
      }),
    )

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
            <h3>
              <FileIcon entry={file} /> &nbsp;
              {file.name}
            </h3>
            <div style={{ width: '100%', borderBottom: '1px solid rgba(128,128,128,0.5)', margin: '1em 0' }} />
            <div>
              Title: &nbsp;
              <b>{movieMetadata.title}</b>
            </div>
            <div>
              Year: &nbsp;<b>{movieMetadata.year}</b>
            </div>
            <div>
              Type: &nbsp;
              <b>{movieMetadata.type}</b>
            </div>
            {movieMetadata.season && (
              <div>
                Season: &nbsp;
                <b>{movieMetadata.season}</b>
              </div>
            )}
            {movieMetadata.episode && (
              <div>
                Episode: &nbsp;
                <b>{movieMetadata.episode}</b>
              </div>
            )}
            <div style={{ width: '100%', borderBottom: '1px solid rgba(128,128,128,0.5)', margin: '1em 0' }} />
            <MovieStatus movie={movieStatus} metadata={movieMetadata} />
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button onclick={() => isOpened.setValue(false)}>Close</Button>
            </div>
          </Paper>
        </div>
      </Modal>
    )
  },
})
