export type FileChangeMessage = {
  type: 'file-change'
  event: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir' | 'all' | 'ready' | 'raw' | 'error'
  path: string
  drive: string
}
