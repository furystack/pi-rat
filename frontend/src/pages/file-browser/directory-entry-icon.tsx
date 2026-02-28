import { Shade, createComponent } from '@furystack/shades'
import { Icon, icons } from '@furystack/shades-common-components'
import type { DirectoryEntry } from 'common'
import { FileIcon } from './file-icon.js'

export const DirectoryEntryIcon = Shade<{ entry: DirectoryEntry }>({
  shadowDomName: 'directory-entry-icon',
  render: ({ props }) => {
    const { entry } = props
    const icon = entry.isDirectory ? (
      <Icon icon={icons.folder} size="small" />
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
      <Icon icon={icons.link} size="small" />
    ) : (
      <Icon icon={icons.info} size="small" />
    )
    return <>{icon}</>
  },
})
