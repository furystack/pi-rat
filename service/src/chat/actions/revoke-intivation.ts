import { getCurrentUser, StoreManager } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { ChatInvitation, type RevokeInvitationAction as RevokeInvitationActionType } from 'common'

export const RevokeInvitationAction: RequestAction<RevokeInvitationActionType> = async ({ getUrlParams, injector }) => {
  const user = await getCurrentUser(injector)

  const { id } = getUrlParams()

  const storeManager = injector.getInstance(StoreManager)
  const chatInvitationStore = storeManager.getStoreFor(ChatInvitation, 'id')

  const chatInvitation = await chatInvitationStore.get(id)

  if (!chatInvitation || chatInvitation.createdBy !== user.username) {
    throw new RequestError('Chat invitation not found or you are not the inviter', 404)
  }

  if (chatInvitation.status !== 'pending') {
    throw new RequestError('Chat invitation can only be revoked if it is pending', 400)
  }

  await chatInvitationStore.update(id, {
    status: 'revoked',
  })

  return JsonResult({ ...chatInvitation, status: 'revoked' }, 200)
}
