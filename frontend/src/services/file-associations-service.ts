import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class FileAssociationsService {
  private videoPlayerExtensions = [
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
  private musicPlayerExtensions = [
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

  private imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg']

  private monacoEditorExtensions = ['js', 'ts', 'json', 'html', 'css', 'scss', 'less', 'md', 'txt']

  public async getServiceForFile(_letter: string, path: string) {
    const extension = path.split('.').pop()
    if (extension) {
      if (this.videoPlayerExtensions.includes(extension)) {
        return 'video-player' as const
      }

      if (this.musicPlayerExtensions.includes(extension)) {
        return 'music-player' as const
      }

      if (this.imageExtensions.includes(extension)) {
        return 'image-viewer' as const
      }

      if (this.monacoEditorExtensions.includes(extension)) {
        return 'monaco-editor' as const
      }
    }

    return null
  }
}
