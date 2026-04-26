import { getCurrentUser, useSystemIdentityContext } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import { RequestError } from '@furystack/rest'
import { JsonResult, type RequestAction } from '@furystack/rest-service'
import { type AcceptInvitationAction as AcceptInvitationActionType } from 'common'
import { ChatDataSet, ChatInvitationDataSet } from '../setup-chat-store.js'

export const AcceptInvitationAction: RequestAction<AcceptInvitationActionType> = async ({ getUrlParams, injector }) => {
  const user = await getCurrentUser(injector)

  const { id } = getUrlParams()

  const systemInjector = useSystemIdentityContext({ injector, username: 'chat-actions' })
  const chatInvitationDataSet = getDataSetFor(injector, ChatInvitationDataSet)

  const chatInvitation = await chatInvitationDataSet.get(systemInjector, id)

  if (!chatInvitation || chatInvitation.userId !== user.username) {
    throw new RequestError('Chat invitation not found or you are not the recipient', 404)
  }

  const chatDataSet = getDataSetFor(injector, ChatDataSet)
  const chat = await chatDataSet.get(systemInjector, chatInvitation.chatId)

  if (!chat) {
    throw new RequestError('Chat not found', 404)
  }

  await chatDataSet.update(systemInjector, chat.id, {
    participants: Array.from(new Set([...chat.participants, user.username])),
  })

  await chatInvitationDataSet.update(systemInjector, id, {
    status: 'accepted',
  })

  return JsonResult({ ...chatInvitation, status: 'accepted' }, 200)
}
