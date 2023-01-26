import { Shade, createComponent } from '@furystack/shades'
import { environmentOptions } from '../../environment-options'

export const UnknownType = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-file-unknown-type-page',
  render: ({ props }) => {
    const { letter, path } = props
    return (
      <div>
        <h1>Unknown File Type</h1>
        <p>There is no viewer for this file type</p>
        <p>Drive: {letter}</p>
        <p>Path: {path}</p>
        <p>
          You can download the file{' '}
          <a
            href={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
              path,
            )}/download`}>
            here
          </a>
          .
        </p>
      </div>
    )
  },
})
