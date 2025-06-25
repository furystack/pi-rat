import { createComponent, Shade } from '@furystack/shades'
import { NotyService, Paper, Skeleton } from '@furystack/shades-common-components'
import { ErrorDisplay } from '../../components/error-display.js'
import { GenericErrorPage } from '../../components/generic-error.js'
import { SessionService } from '../../services/session.js'
import { ChatInvitationService } from './chat-intivation-service.js'

export const ChatInvitationList = Shade({
  shadowDomName: 'shade-app-chat-invitation-list',
  style: {
    display: 'flex',
    width: '100%',
  },
  render: ({ injector, useObservable }) => {
    const chatInvitationService = injector.getInstance(ChatInvitationService)

    const currentUser = injector.getInstance(SessionService).currentUser.getValue()

    const [invitations] = useObservable(
      'chatInvitations',
      chatInvitationService.getChatInvitationsAsObservable({
        filter: {
          status: { $eq: 'pending' },
        },
      }),
    )

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

    const noty = injector.getInstance(NotyService)

    return (
      <Paper style={{ width: '100%' }}>
        {invitations.value.entries.length === 0 ? (
          <p>🪹 No invitations</p>
        ) : (
          <>
            <h2>📨 Invitations</h2>

            <ul>
              {invitations.value.entries.map((invitation) => (
                <li
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                  }}
                >
                  <p>{invitation.userId}</p>
                  <p>{invitation.chatName}</p>
                  <div>
                    {invitation.userId === currentUser?.username ? (
                      <>
                        {invitation.status === 'pending' ? (
                          <button
                            onclick={async () => {
                              await chatInvitationService
                                .acceptChatInvitation(invitation.id)
                                .then(() => {
                                  noty.emit('onNotyAdded', {
                                    type: 'success',
                                    title: 'Invitation Accepted',
                                    body: `Invitation to chat "${invitation.chatName}" accepted!`,
                                  })
                                })
                                .catch((error) => {
                                  noty.emit('onNotyAdded', {
                                    type: 'error',
                                    title: 'Error Accepting Invitation',
                                    body: <ErrorDisplay error={error} />,
                                  })
                                })
                            }}
                          >
                            Accept
                          </button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Paper>
    )
  },
})
