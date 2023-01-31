import { attachStyles, createComponent, LazyLoad, Shade } from '@furystack/shades'
import { MonacoEditor } from '../../components/monaco-editor'
import { environmentOptions } from '../../environment-options'

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
      <LazyLoad
        loader={<div>Loading...</div>}
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
                left: '0',
                width: '100%',
                height: '100%',
                display: 'block',
              }}>
              <MonacoEditor
                options={{
                  language: getMonacoLanguage(path),
                  theme: 'vs-dark',
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
