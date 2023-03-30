import { Shade, createComponent } from '@furystack/shades'
import type { DirectoryEntry } from 'common'

const movieExtensions = ['mkv', 'mov', 'mp4', 'avi']
const musicExtensions = ['mp3', 'wav', 'ogg', 'flac']
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg']
const textDocumentExtensions = ['txt', 'md', 'doc', 'docx', 'pdf', 'rtf', 'odt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx']

export const FileIcon = Shade<{ entry: DirectoryEntry }>({
  shadowDomName: 'file-icon',
  render: ({ props }) => {
    const { entry } = props
    const { name } = entry
    const extension = name.split('.').pop()

    if (extension) {
      if (movieExtensions.includes(extension)) {
        return <>🎬</>
      }

      if (musicExtensions.includes(extension)) {
        return <>🎵</>
      }

      if (imageExtensions.includes(extension)) {
        return <>🖼️</>
      }

      if (textDocumentExtensions.includes(extension)) {
        return <>📄</>
      }
    }

    return <>❓</>
  },
})
