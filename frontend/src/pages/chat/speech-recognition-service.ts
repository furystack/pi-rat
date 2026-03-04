import { Injectable } from '@furystack/inject'
import { Semaphore } from '@furystack/utils'

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
  private readonly semaphore = new Semaphore(1)

  public recognizeSpeech(): Promise<string> {
    return this.semaphore.execute(() => this.performRecognition())
  }

  private performRecognition(): Promise<string> {
    if (typeof webkitSpeechRecognition === 'undefined') {
      return Promise.reject(new Error('Speech recognition is not supported in this browser.'))
    }

    const speechRecognition = new webkitSpeechRecognition()

    return new Promise((resolve, reject) => {
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
        reject(new Error('Speech recognition ended without result.'))
      }

      speechRecognition.start()
    })
  }
}
