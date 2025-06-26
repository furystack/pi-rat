import { getCurrentUser, StoreManager } from '@furystack/core'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { Chat, ChatInvitation, type AcceptInvitationAction as AcceptInvitationActionType } from 'common'

export const AcceptInvitationAction: RequestAction<AcceptInvitationActionType> = async ({ getUrlParams, injector }) => {
  const user = await getCurrentUser(injector)

  const { id } = getUrlParams()

  const storeManager = injector.getInstance(StoreManager)
  const chatInvitationStore = storeManager.getStoreFor(ChatInvitation, 'id')

  const chatInvitation = await chatInvitationStore.get(id)

  if (!chatInvitation || chatInvitation.userId !== user.username) {
    throw new RequestError('Chat invitation not found or you are not the recipient', 404)
  }

  const chatStore = storeManager.getStoreFor(Chat, 'id')
  const chat = await chatStore.get(chatInvitation.chatId)

  if (!chat) {
    throw new RequestError('Chat not found', 404)
  }

  await chatStore.update(chat.id, {
    participants: Array.from(new Set([...chat.participants, user.username])),
  })

  await chatInvitationStore.update(id, {
    status: 'accepted',
  })

  return JsonResult({ ...chatInvitation, status: 'accepted' }, 200)
}
