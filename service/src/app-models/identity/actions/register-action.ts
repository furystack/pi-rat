import { StoreManager } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { PasswordAuthenticator, PasswordCredential } from '@furystack/security'
import type { RegisterAction as RegisterActionType } from 'common'
import { User } from 'common'

export const RegisterAction: RequestAction<RegisterActionType> = async ({ injector, getBody }) => {
  const logger = getLogger(injector).withScope('Register')
  const postBody = await getBody()
  const { username, password } = postBody as { username: string; password: string }

  const storeManager = injector.getInstance(StoreManager)
  const authenticator = injector.getInstance(PasswordAuthenticator)

  // Check if user already exists
  const userStore = storeManager.getStoreFor(User, 'username')
  const existingUser = await userStore.get(username)
  if (existingUser) {
    await logger.warning({ message: `Registration attempt for existing user: ${username}` })
    throw new RequestError('User already exists', 409)
  }

  try {
    // Create password credential first (this can fail early if password is invalid)
    const credential = await authenticator.hasher.createCredential(username, password)
    await logger.information({ message: `Password credential created for: ${username}` })

    // Create user with default (empty) roles
    const newUser: User = {
      username,
      roles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await userStore.add(newUser)
    await logger.information({ message: `User created: ${username}` })

    // Now add the credential to the store
    await storeManager.getStoreFor(PasswordCredential, 'userName').add(credential)
    await logger.information({ message: `Registration completed for: ${username}` })

    return JsonResult({
      username: newUser.username,
      roles: newUser.roles,
    })
  } catch (error) {
    await logger.error({ message: `Registration failed for ${username}`, data: { error } })

    // Clean up any partial state - try to remove user if it was created
    try {
      await userStore.remove(username)
      await logger.information({ message: `Cleaned up user ${username} after registration failure` })
    } catch (cleanupError) {
      // Ignore cleanup errors - user might not have been created yet
      await logger.warning({ message: `Could not cleanup user after registration error`, data: { cleanupError } })
    }

    throw new RequestError('Registration failed', 400)
  }
}
