import { defineService, type Token } from '@furystack/inject'
import { environmentOptions } from '../utils/environment-options.js'

export interface ErrorReporter {
  sendErrorReport(
    error: Error,
    context?: string,
    repository?: string,
    appVersion?: string,
    buildDate?: string,
    commitHash?: string,
  ): void
}

export const ErrorReporter: Token<ErrorReporter, 'singleton'> = defineService({
  name: 'pi-rat/ErrorReporter',
  lifetime: 'singleton',
  factory: () => ({
    sendErrorReport: (
      error,
      context,
      repository = environmentOptions.repository,
      appVersion = 'Unknown', // TODO
      buildDate = 'Unknown', // TODO
      commitHash = 'Unknown', // TODO
    ) => {
      const title = `Automated Bug Report - ${error.message}`
      const body = `
# 🐜 Automated Bug Report

## 👉 Steps To Reproduce

## Additional Context

${context || 'none'}

## Stack

\`\`\`\`
${error.stack}
\`\`\`\`

## Environment

App version: ${appVersion}

Build date: ${buildDate}

[GH Commit](${repository}/commit/${commitHash})`
      window.open(
        `${repository}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=bug`,
      )
    },
  }),
})
