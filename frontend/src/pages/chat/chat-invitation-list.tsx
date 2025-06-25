import { createComponent, Shade } from '@furystack/shades'
import { Paper, Skeleton } from '@furystack/shades-common-components'
import { GenericErrorPage } from '../../components/generic-error.js'
import { ChatInvitationService } from './chat-intivation-service.js'

export const ChatInvitationList = Shade({
  shadowDomName: 'shade-app-chat-invitation-list',
  style: {
    display: 'flex',
    width: '100%',
  },
  render: ({ injector, useObservable }) => {
    const chatInvitationService = injector.getInstance(ChatInvitationService)

    const [invitations] = useObservable('chatInvitations', chatInvitationService.getChatInvitationsAsObservable({}))

    if (invitations.status === 'failed') {
      return <GenericErrorPage error={invitations.error} />
    }

    if (!invitations.value) {
      return (
        <Paper>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </Paper>
      )
    }

    return (
      <Paper style={{ width: '100%' }}>
        <h2>Invitations</h2>
        {invitations.value.entries.length === 0 ? (
          <p>No invitations found.</p>
        ) : (
          <ul>
            {invitations.value.entries.map((invitation) => (
              <li>
                <p>{invitation.userId}</p>
                <p>{invitation.chatId}</p>
                <p>{invitation.status}</p>
              </li>
            ))}
          </ul>
        )}
      </Paper>
    )
  },
})
