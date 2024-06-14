import { Shade, createComponent } from '@furystack/shades'
import { Paper } from '@furystack/shades-common-components'
import { environmentOptions } from '../../environment-options.js'

export const UnknownType = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-file-unknown-type-page',
  render: ({ props }) => {
    const { letter, path } = props
    return (
      <div style={{ padding: '96px' }}>
        <Paper style={{ display: 'block' }}>
          <h1>Unknown File Type</h1>
          <p>There is no viewer for this file type</p>
          <p>Drive: {letter}</p>
          <p>Path: {path}</p>
          <p>
            You can download the file{' '}
            <a
              href={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
                path,
              )}/download`}
            >
              here
            </a>
            .
          </p>
        </Paper>
      </div>
    )
  },
})
