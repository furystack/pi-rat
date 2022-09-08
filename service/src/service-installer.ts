import { StoreManager } from '@furystack/core'
import { Injectable, Injected } from '@furystack/inject'
import { PasswordAuthenticator, PasswordCredential } from '@furystack/security'
import { ServiceStatus, User } from 'common'

@Injectable()
export class ServiceStatusProvider {
  public async getStatus(): Promise<ServiceStatus> {
    const userCount = await this.storeManager.getStoreFor(User, 'username').count()
    return userCount > 0 ? 'installed' : 'needsInstall'
  }

  public async install(username: string, password: string): Promise<void> {
    const status = await this.getStatus()
    if (status === 'installed') {
      throw Error('Service is already installed')
    }
    await this.storeManager.getStoreFor(User, 'username').add({
      username,
      roles: ['admin'],
    })
    const credential = await this.authenticator.getHasher().createCredential(username, password)
    await this.storeManager.getStoreFor(PasswordCredential, 'userName').add(credential)
  }

  @Injected(StoreManager)
  public storeManager!: StoreManager

  @Injected(PasswordAuthenticator)
  public authenticator!: PasswordAuthenticator
}
