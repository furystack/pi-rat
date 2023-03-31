export class DirectoryEntry {
  name!: string
  isFile!: boolean
  isDirectory!: boolean
  isBlockDevice!: boolean
  isCharacterDevice!: boolean
  isSymbolicLink!: boolean
  isFIFO!: boolean
  isSocket!: boolean
}
