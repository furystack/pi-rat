import { createComponent, LazyLoad, Shade } from '@furystack/shades'
import { Loader } from '@furystack/shades-common-components'
import { FileAssociationsService } from '../../services/file-associations-service'
import { ImageViewer } from './image-viewer'
import { MonacoFileEditor } from './monaco-file-editor'
import { UnknownType } from './unknown-type'
import { VideoPlayer } from './video-player'

export const FilesPage = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-files-page',
  render: ({ props, injector }) => {
    const { letter, path } = props

    return (
      <LazyLoad
        loader={<Loader />}
        component={async () => {
          const associations = await injector.getInstance(FileAssociationsService)
          const component = await associations.getServiceForFile(letter, path)

          switch (component) {
            case 'image-viewer':
              return <ImageViewer letter={letter} path={path} />
            case 'video-player':
              return <VideoPlayer letter={letter} path={path} />
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