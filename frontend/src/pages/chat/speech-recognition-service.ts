import { Injectable } from '@furystack/inject'
import { Lock } from 'semaphore-async-await'

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
  public lock = new Lock()

  public async recognizeSpeech(): Promise<string> {
    try {
      await this.lock.acquire()

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
    } finally {
      this.lock.release()
    }
  }
}
