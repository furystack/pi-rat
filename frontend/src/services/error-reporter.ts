import { Injectable } from '@furystack/inject'
import { environmentOptions } from '../environment-options.js'
@Injectable()
export class ErrorReporter {
  public sendErrorReport(
    error: Error,
    context?: string,
    repository = environmentOptions.repository,
    appVersion = 'Unknown', // TODO
    buildDate = 'Unknown', // TODO
    commitHash = 'Unknown', // TODO
  ) {
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
  }
}
