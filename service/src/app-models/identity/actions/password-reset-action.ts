import { getCurrentUser } from '@furystack/core'
import { getLogger } from '@furystack/logging'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { PasswordAuthenticator, PasswordComplexityError, UnauthenticatedError } from '@furystack/security'
import type { PasswordResetAction as PasswordResetActionType } from 'common'

export const PasswordResetAction: RequestAction<PasswordResetActionType> = async ({ injector, getBody }) => {
  const logger = getLogger(injector).withScope('PasswordReset')

  const postBody = await getBody()
  const { currentPassword, newPassword } = postBody

  // Get the current authenticated user
  const currentUser = await getCurrentUser(injector)

  if (!currentUser) {
    await logger.warning({ message: 'Password reset attempt without authentication' })
    throw new RequestError('User not authenticated', 401)
  }

  const authenticator = injector.get(PasswordAuthenticator)

  try {
    // Use the authenticator's setPasswordForUser method which handles:
    // - Password complexity validation
    // - Current password verification
    // - Creating and storing the new password credential
    await authenticator.setPasswordForUser(currentUser.username, currentPassword, newPassword)

    await logger.information({ message: `Password reset completed for user: ${currentUser.username}` })

    return JsonResult({ success: true })
  } catch (error) {
    await logger.error({ message: `Password reset failed for ${currentUser.username}`, data: { error } })

    if (error instanceof UnauthenticatedError) {
      throw new RequestError('Current password is incorrect', 400)
    }

    if (error instanceof PasswordComplexityError) {
      throw new RequestError(`Password does not meet complexity requirements`, 400)
    }

    if (error instanceof RequestError) {
      throw error
    }

    throw new RequestError('Password reset failed', 500)
  }
}
