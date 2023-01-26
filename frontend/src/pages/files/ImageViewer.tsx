import { createComponent, Shade } from '@furystack/shades'
import { environmentOptions } from '../../environment-options'

export const ImageViewer = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-files-image-viewer',
  render: ({ props }) => {
    const { letter, path } = props
    return (
      <img
        src={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
          path,
        )}/download`}
        alt={path}
      />
    )
  },
})
