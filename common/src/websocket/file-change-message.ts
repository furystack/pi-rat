export type FileChangeMessage = {
  type: 'file-change'
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir'
  path: string
  drive: string
}
