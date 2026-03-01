import { Shade, createComponent } from '@furystack/shades'
import { Icon, icons } from '@furystack/shades-common-components'
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
        return <Icon icon={icons.film} size="small" />
      }

      if (musicExtensions.includes(extension)) {
        return <Icon icon={icons.music} size="small" />
      }

      if (imageExtensions.includes(extension)) {
        return <Icon icon={icons.image} size="small" />
      }

      if (textDocumentExtensions.includes(extension)) {
        return <Icon icon={icons.fileText} size="small" />
      }
    }

    return <Icon icon={icons.file} size="small" />
  },
})
