import { createComponent, LazyLoad, Shade } from '@furystack/shades'
import { MonacoEditor } from '../../components/monaco-editor'
import { environmentOptions } from '../../environment-options'

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
          await result.text()
          return (
            <div
              style={{
                position: 'fixed',
                top: '0',
                left: '0',
                overflow: 'hidden',
                width: '100%',
                height: '100%',
              }}>
              <MonacoEditor
                options={{
                  language: 'typescript',
                  theme: 'vs-dark',
                  automaticLayout: true,
                }}
                // value={text.toString()}
              />
            </div>
          )
        }}
      />
    )
  },
})
