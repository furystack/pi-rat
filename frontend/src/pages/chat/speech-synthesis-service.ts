import { defineService, type Token } from '@furystack/inject'

export interface SpeechSynthesisService {
  speak(text: string): void
}

export const SpeechSynthesisService: Token<SpeechSynthesisService, 'singleton'> = defineService({
  name: 'pi-rat/SpeechSynthesisService',
  lifetime: 'singleton',
  factory: () => ({
    speak: (text: string) => {
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'hu-HU'
        utterance.voice = window.speechSynthesis.getVoices().find((voice) => voice.lang === 'hu-HU') || null
        window.speechSynthesis.speak(utterance)
      } else {
        console.warn('Speech synthesis is not supported in this browser.')
      }
    },
  }),
})
