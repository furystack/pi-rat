import { Injectable } from '@furystack/inject'

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList
}

type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult
  length: number
}

type SpeechRecognitionError = {
  error: string
  message: string
}

declare class webkitSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  public start(): void
  public stop(): void
  public onresult: (event: SpeechRecognitionEvent) => void
  public onerror: (event: SpeechRecognitionError) => void
  public onend: () => void
}

@Injectable({ lifetime: 'singleton' })
export class SpeechRecognitionService {
  private pending: Promise<void> = Promise.resolve()

  public recognizeSpeech(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.pending = this.pending.then(async () => {
        try {
          const result = await this.performRecognition()
          resolve(result)
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      })
    })
  }

  private performRecognition(): Promise<string> {
    const speechRecognition = new webkitSpeechRecognition()

    return new Promise((resolve, reject) => {
      if (!speechRecognition) {
        reject(new Error('Speech recognition is not supported in this browser.'))
        return
      }

      speechRecognition.lang = 'hu-HU'

      speechRecognition.onresult = (event) => {
        if (event.results.length > 0) {
          resolve(event.results[0][0].transcript)
        } else {
          reject(new Error('No speech recognized.'))
        }
      }

      speechRecognition.onerror = (event: SpeechRecognitionError) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      speechRecognition.onend = () => {
        console.log('Speech recognition ended.')
      }

      speechRecognition.start()
    })
  }
}
