import { createComponent, Shade } from '@furystack/shades'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'
import { FileAssociationsService } from '../../services/file-associations-service.js'
import { FileMoviePlayer } from './file-movie-player.js'
import { ImageViewer } from './image-viewer.js'
import { MonacoFileEditor } from './monaco-file-editor.js'
import { UnknownType } from './unknown-type.js'

export const FilesPage = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-files-page',
  render: ({ props, injector }) => {
    const { letter, path } = props

    return (
      <PiRatLazyLoad
        component={async () => {
          const associations = injector.getInstance(FileAssociationsService)
          const component = await associations.getServiceForFile(letter, path)

          switch (component) {
            case 'image-viewer':
              return <ImageViewer letter={letter} path={path} />
            case 'video-player':
              return <FileMoviePlayer file={{ driveLetter: letter, path }} />
            case 'monaco-editor':
              return <MonacoFileEditor letter={letter} path={path} />
            default:
              return <UnknownType letter={letter} path={path} />
          }
        }}
      />
    )
  },
})
