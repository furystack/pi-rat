import { useSystemIdentityContext } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import { HttpUserContext, JsonResult, type RequestAction } from '@furystack/rest-service'
import { PasswordAuthenticator, PasswordCredentialDataSet } from '@furystack/security'
import type { RegisterAction as RegisterActionType } from 'common'
import type { User } from 'common'
import { UserDataSet } from '../setup-identity-store.js'

export const RegisterAction: RequestAction<RegisterActionType> = async ({ injector, getBody, response }) => {
  const logger = getLogger(injector).withScope('Register')
  const postBody = await getBody()
  const { username, password } = postBody

  const systemInjector = useSystemIdentityContext({ injector, username: 'registration' })
  const userDataSet = getDataSetFor(injector, UserDataSet)
  const authenticator = injector.get(PasswordAuthenticator)

  // Check if user already exists
  const existingUser = await userDataSet.get(systemInjector, username)
  if (existingUser) {
    await logger.warning({ message: `Registration attempt for existing user: ${username}` })
    throw new RequestError('User already exists', 409)
  }

  try {
    const credential = await authenticator.hasher.createCredential(username, password)

    const newUser: User = {
      username,
      roles: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await userDataSet.add(systemInjector, newUser)
    await logger.information({ message: `User created: ${username}` })

    const credentialDataSet = getDataSetFor(injector, PasswordCredentialDataSet)
    await credentialDataSet.add(systemInjector, credential)
    await logger.information({ message: `Registration completed for: ${username}` })

    const userContext = injector.get(HttpUserContext)
    const user = await userContext.authenticateUser(username, password)
    await userContext.cookieLogin(user, response)

    return JsonResult({
      username: newUser.username,
      roles: newUser.roles,
    })
  } catch (error) {
    await logger.error({ message: `Registration failed for ${username}`, data: { error } })

    // Clean up any partial state - try to remove user if it was created
    try {
      await userDataSet.remove(systemInjector, username)
      await logger.information({ message: `Cleaned up user ${username} after registration failure` })
    } catch (cleanupError) {
      // Ignore cleanup errors - user might not have been created yet
      await logger.warning({ message: `Could not cleanup user after registration error`, data: { cleanupError } })
    }

    throw new RequestError('Registration failed', 400)
  }
}
