import { Shade, createComponent } from '@furystack/shades'
import type { DirectoryEntry } from 'common'
import { FileIcon } from './file-icon.js'

export const DirectoryEntryIcon = Shade<{ entry: DirectoryEntry }>({
  shadowDomName: 'directory-entry-icon',
  render: ({ props }) => {
    const { entry } = props
    const icon = entry.isDirectory ? (
      '📁'
    ) : entry.isFile ? (
      <FileIcon entry={entry} />
    ) : entry.isBlockDevice ? (
      '💽'
    ) : entry.isCharacterDevice ? (
      '💾'
    ) : entry.isFIFO ? (
      '📟'
    ) : entry.isSocket ? (
      '📡'
    ) : entry.isSymbolicLink ? (
      '🔗'
    ) : (
      '❓'
    )
    return <>{icon}</>
  },
})
