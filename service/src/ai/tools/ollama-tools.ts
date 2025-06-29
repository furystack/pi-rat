import type { Injector } from '@furystack/inject'
import type { ChatResponse, ModelResponse, Tool } from 'ollama'
import { MoviesTool } from './movies-tool.js'
import { TimeTool } from './time-tool.js'
import { UserContextTool } from './user-info-tool.js'
import { WatchHistoryEntriesTool } from './watch-history-entries-tool.js'

export type OllamaTool = {
  toolDefinition: Tool
  shouldExecute: (response: ChatResponse) => boolean
  execute: (injector: Injector, response: ChatResponse) => Promise<string | null>
}

export const OllamaTools: OllamaTool[] = [TimeTool, UserContextTool, MoviesTool, WatchHistoryEntriesTool]

// TODO: Find a more elegant way to handle this
const toolingSupportedModels = [
  'deepseek-r1',
  'qwen3',
  'llama3.1',
  'llama3.2',
  'mistral',
  'qwen2.5',
  'qwen2.5-coder',
  'qwen2',
  'mistral-nemo',
  'llama3.3',
  'qwq',
  'mixtral',
  'mistral-small',
  'smollm2',
  'llama4',
  'command-r',
  'hermes3',
  'phi4-mini',
  'granite3.3',
  'devstral',
  'mistral-small3.1',
  'cogito',
  'magistral',
  'mistral-large',
  'granite3.2-vision',
  'command-r-plus',
  'granite3.2',
  'granite3-dense',
  'granite3.1-dense',
  'nemotron-mini',
  'athene-v2',
  'nemotron',
  'llama3-groq-tool-use',
  'aya-expanse',
  'granite3-moe',
  'granite3.1-moe',
  'command-r7b',
  'firefunction-v2',
  'command-a',
  'mistral-small3.2',
  'command-r7b-arabic',
]

export const isToolingSupported = (model: ModelResponse) => {
  return toolingSupportedModels.includes(model.name) || toolingSupportedModels.includes(model.name.split(':')[0])
}
