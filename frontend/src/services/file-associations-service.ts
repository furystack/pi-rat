import { defineService, type Token } from '@furystack/inject'

export type FileAssociationKind = 'video-player' | 'music-player' | 'image-viewer' | 'monaco-editor'

export interface FileAssociationsService {
  getServiceForFile(letter: string, path: string): Promise<FileAssociationKind | null>
}

const videoPlayerExtensions = [
  'mp4',
  'webm',
  'ogg',
  'avi',
  'mov',
  'wmv',
  'flv',
  'mkv',
  'mpg',
  'mpeg',
  'm4v',
  '3gp',
  '3g2',
  'f4v',
  'f4p',
  'f4a',
  'f4b',
]

const musicPlayerExtensions = [
  'mp3',
  'wav',
  'flac',
  'aac',
  'ogg',
  'wma',
  'm4a',
  'm4b',
  'm4p',
  'm4r',
  'm4v',
  '3gp',
  '3g2',
  'f4v',
  'f4p',
  'f4a',
  'f4b',
]

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg']

const monacoEditorExtensions = [
  'js',
  'ts',
  'json',
  'html',
  'css',
  'scss',
  'less',
  'md',
  'txt',
  'mjs',
  'jsx',
  'tsx',
  'vue',
  'yml',
  'yaml',
]

export const FileAssociationsService: Token<FileAssociationsService, 'singleton'> = defineService({
  name: 'pi-rat/FileAssociationsService',
  lifetime: 'singleton',
  factory: () => ({
    getServiceForFile: async (_letter, path) => {
      const extension = path.split('.').pop()
      if (!extension) return null
      if (videoPlayerExtensions.includes(extension)) return 'video-player'
      if (musicPlayerExtensions.includes(extension)) return 'music-player'
      if (imageExtensions.includes(extension)) return 'image-viewer'
      if (monacoEditorExtensions.includes(extension)) return 'monaco-editor'
      return null
    },
  }),
})
