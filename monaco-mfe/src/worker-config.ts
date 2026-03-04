import type { Environment } from 'monaco-editor'

type WorkerModule = { default: new (options?: { name?: string }) => Worker }

const getWorker = async (_: string, label: string) => {
  let worker: WorkerModule

  switch (label) {
    case 'json':
      worker = (await import('monaco-editor/esm/vs/language/json/json.worker?worker')) as WorkerModule
      break
    case 'css':
    case 'scss':
    case 'less':
      worker = (await import('monaco-editor/esm/vs/language/css/css.worker?worker')) as WorkerModule
      break
    case 'html':
    case 'handlebars':
    case 'razor':
      worker = (await import('monaco-editor/esm/vs/language/html/html.worker?worker')) as WorkerModule
      break
    case 'typescript':
    case 'javascript':
      worker = (await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker')) as WorkerModule
      break
    default:
      worker = (await import('monaco-editor/esm/vs/editor/editor.worker?worker')) as WorkerModule
  }

  return new worker.default()
}

self.MonacoEnvironment = {
  ...(self.MonacoEnvironment as Environment),
  getWorker,
}
