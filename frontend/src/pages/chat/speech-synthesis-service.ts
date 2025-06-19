import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class SpeechSynthesisService {
  public speak(text: string) {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'hu-HU'
      utterance.voice = window.speechSynthesis.getVoices().find((voice) => voice.lang === 'hu-HU') || null
      window.speechSynthesis.speak(utterance)
    } else {
      console.warn('Speech synthesis is not supported in this browser.')
    }
  }
}
