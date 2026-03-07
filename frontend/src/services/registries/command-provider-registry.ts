import { Injectable } from '@furystack/inject'
import type { CommandProvider } from '@furystack/shades-common-components'

@Injectable({ lifetime: 'singleton' })
export class CommandProviderRegistry {
  private providers: CommandProvider[] = []

  public registerProvider(provider: CommandProvider) {
    this.providers.push(provider)
  }

  public getProviders(): CommandProvider[] {
    return [...this.providers]
  }
}
