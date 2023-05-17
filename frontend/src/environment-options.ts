/// <reference types="vite/client" />

export interface ImportMetaEnv {
  readonly serviceUrl?: string
  // more env variables...
}

export interface ImportMeta {
  readonly env: ImportMetaEnv
}

export const environmentOptions = {
  repository: 'http://github.com/furystack/pi-rat',
  serviceUrl: import.meta.env.VITE_SERVICE_URL || '/api',
}
