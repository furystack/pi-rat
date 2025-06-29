export interface OllamaConfig {
  id: 'OLLAMA_CONFIG'
  value: {
    /**
     * The Ollama host URL, including the protocol (http or https). E.g.: http://localhost:11434
     */
    host: string
  }
}
