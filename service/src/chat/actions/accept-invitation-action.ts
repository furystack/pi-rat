import { getCurrentUser, StoreManager } from '@furystack/core'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { Chat, ChatInvitation, type AcceptInvitationAction as AcceptInvitationActionType } from 'common'

export const AcceptInvitationAction: RequestAction<AcceptInvitationActionType> = async ({ getUrlParams, injector }) => {
  const user = await getCurrentUser(injector)

  if (!user) {
    return JsonResult({ success: false, error: 'Unauthorized' }, 401)
  }

  const { id } = getUrlParams()

  const storeManager = injector.getInstance(StoreManager)
  const chatInvitationStore = storeManager.getStoreFor(ChatInvitation, 'id')

  const chatInvitation = await chatInvitationStore.get(id)

  if (!chatInvitation || chatInvitation.userId !== user.username) {
    return JsonResult({ success: false, error: 'Chat invitation not found or you are not the recipient' }, 404)
  }

  if (chatInvitation.status !== 'pending') {
    return JsonResult(
      { success: false, error: 'Chat invitation is not pending. Only pending invitations can be accepted' },
      400,
    )
  }

  const chatStore = storeManager.getStoreFor(Chat, 'id')
  const chat = await chatStore.get(chatInvitation.chatId)

  if (!chat) {
    return JsonResult({ success: false, error: 'Chat not found' }, 404)
  }

  await chatStore.update(chat.id, {
    participants: Array.from(new Set([...chat.participants, user.username])),
  })

  await chatInvitationStore.update(id, {
    status: 'accepted',
  })

  return JsonResult({ success: true })
}
