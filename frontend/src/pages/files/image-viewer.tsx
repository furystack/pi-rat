import { createComponent, Shade } from '@furystack/shades'
import { environmentOptions } from '../../environment-options.js'

export const ImageViewer = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-files-image-viewer',
  render: ({ props }) => {
    const { letter, path } = props
    return (
      <div
        style={{
          paddingTop: '64px',
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 style={{ paddingLeft: '2em' }}>
          {letter}:{path}
        </h1>
        <img
          style={{
            maxWidth: '100%',
            maxHeight: '80%',
            objectFit: 'contain',
          }}
          src={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
            path,
          )}/download`}
          alt={path}
        />
      </div>
    )
  },
})
