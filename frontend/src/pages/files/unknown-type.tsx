import { Shade, createComponent } from '@furystack/shades'
import { Paper, Typography } from '@furystack/shades-common-components'
import { environmentOptions } from '../../utils/environment-options.js'

export const UnknownType = Shade<{ letter: string; path: string }>({
  customElementName: 'drives-file-unknown-type-page',
  render: ({ props }) => {
    const { letter, path } = props
    return (
      <div style={{ padding: '96px' }}>
        <Paper style={{ display: 'block' }}>
          <Typography variant="h1">Unknown File Type</Typography>
          <Typography variant="body1">There is no viewer for this file type</Typography>
          <Typography variant="body1">Drive: {letter}</Typography>
          <Typography variant="body1">Path: {path}</Typography>
          <Typography variant="body1">
            You can download the file{' '}
            <a
              href={`${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
                path,
              )}/download`}
            >
              here
            </a>
            .
          </Typography>
        </Paper>
      </div>
    )
  },
})
