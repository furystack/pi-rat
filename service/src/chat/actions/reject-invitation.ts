import { getCurrentUser, StoreManager } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { ChatInvitation, type RejectInvitationAction as RejectInvitationActionType } from 'common'

export const RejectInvitationAction: RequestAction<RejectInvitationActionType> = async ({ getUrlParams, injector }) => {
  const user = await getCurrentUser(injector)

  const { id } = getUrlParams()

  const storeManager = injector.getInstance(StoreManager)
  const chatInvitationStore = storeManager.getStoreFor(ChatInvitation, 'id')

  const chatInvitation = await chatInvitationStore.get(id)

  if (!chatInvitation || chatInvitation.userId !== user.username) {
    throw new RequestError('Chat invitation not found or you are not the recipient', 404)
  }

  if (chatInvitation.status !== 'pending') {
    throw new RequestError('Chat invitation is not pending. Only pending invitations can be rejected', 400)
  }

  await chatInvitationStore.update(id, {
    status: 'rejected',
  })

  return JsonResult({ ...chatInvitation, status: 'rejected' }, 200)
}
