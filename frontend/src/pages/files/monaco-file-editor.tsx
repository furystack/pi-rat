import { createComponent, Shade } from '@furystack/shades'
import { MonacoEditor } from '../../components/monaco-editor.js'
import { environmentOptions } from '../../environment-options.js'
import { PiRatLazyLoad } from '../../components/pirat-lazy-load.js'

const getMonacoLanguage = (path: string) => {
  const extension = path.split('.').pop()
  switch (extension) {
    case 'js':
    case 'ts':
      return 'typescript'
    case 'json':
      return 'json'
    case 'html':
      return 'html'
    case 'md':
      return 'markdown'
    default:
      return 'plaintext'
  }
}

export const MonacoFileEditor = Shade<{ letter: string; path: string }>({
  shadowDomName: 'drives-files-monaco-editor',
  render: ({ props }) => {
    const { letter, path } = props

    return (
      <PiRatLazyLoad
        component={async () => {
          const result = await fetch(
            `${environmentOptions.serviceUrl}/drives/files/${encodeURIComponent(letter)}/${encodeURIComponent(
              path,
            )}/download`,
            {
              credentials: 'include',
            },
          )

          if (!result.ok) {
            throw new Error('Failed to load file')
          }

          const text = await result.text()
          return (
            <div
              style={{
                position: 'fixed',
                top: '54px',
                width: '100%',
                height: 'calc(100% - 64px)',
              }}>
              <MonacoEditor
                options={{
                  language: getMonacoLanguage(path),
                  automaticLayout: true,
                }}
                value={text}
              />
            </div>
          )
        }}
      />
    )
  },
})
