import { createComponent, Shade } from '@furystack/shades'
import { Button, NotyService, Paper, Skeleton } from '@furystack/shades-common-components'
import { ErrorDisplay } from '../../components/error-display.js'
import { GenericErrorPage } from '../../components/generic-error.js'
import { SessionService } from '../../services/session.js'
import { ChatInvitationService } from './chat-intivation-service.js'

export const ChatInvitationList = Shade({
  shadowDomName: 'shade-app-chat-invitation-list',
  style: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
  },
  render: ({ injector, useObservable, useDisposable }) => {
    const filter = { filter: { status: { $eq: 'pending' } } } as const

    const chatInvitationService = injector.getInstance(ChatInvitationService)
    const currentUser = injector.getInstance(SessionService).currentUser.getValue()

    const reloadChatInvitations = () => {
      void chatInvitationService.getChatInvitations(filter)
    }

    useDisposable('onInvitationAccepted', () =>
      chatInvitationService.subscribe('invitationAccepted', reloadChatInvitations),
    )

    useDisposable('onInvitationRejected', () =>
      chatInvitationService.subscribe('invitationRejected', reloadChatInvitations),
    )

    useDisposable('onInvitationRevoked', () =>
      chatInvitationService.subscribe('invitationRevoked', reloadChatInvitations),
    )

    useDisposable('onInvitationCreated', () =>
      chatInvitationService.subscribe('invitationCreated', reloadChatInvitations),
    )

    const [invitations] = useObservable('chatInvitations', chatInvitationService.getChatInvitationsAsObservable(filter))

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

    const received = invitations.value.entries.filter(
      (invitation) => invitation.userId === currentUser?.username && invitation.status === 'pending',
    )

    const sent = invitations.value.entries.filter(
      (invitation) => invitation.createdBy === currentUser?.username && invitation.status === 'pending',
    )

    return (
      <>
        {received.length ? (
          <Paper style={{ width: '100%' }}>
            <h2>Invitations</h2>

            <ul style={{ padding: '0', margin: '0' }}>
              {received.map((invitation) => (
                <li
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    alignContent: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {invitation.userId === currentUser?.username ? (
                    <>
                      {invitation.status === 'pending' ? (
                        <>
                          <p>{invitation.chatName}</p>
                          <Button
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
                            ✅
                          </Button>
                          <Button
                            onclick={async () => {
                              await chatInvitationService
                                .rejectChatInvitation(invitation.id)
                                .then(() => {
                                  noty.emit('onNotyAdded', {
                                    type: 'success',
                                    title: 'Invitation Rejected',
                                    body: `Invitation to chat "${invitation.chatName}" rejected!`,
                                  })
                                })
                                .catch((error) => {
                                  noty.emit('onNotyAdded', {
                                    type: 'error',
                                    title: 'Error Rejecting Invitation',
                                    body: <ErrorDisplay error={error} />,
                                  })
                                })
                            }}
                          >
                            ❌
                          </Button>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </Paper>
        ) : null}
        {sent.length ? (
          <Paper style={{ width: '100%' }}>
            <h2>Sent Invitations</h2>

            <ul style={{ padding: '0', margin: '0' }}>
              {sent.map((invitation) => (
                <li
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    alignContent: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {invitation.userId === currentUser?.username ? (
                    <>
                      {invitation.status === 'pending' ? (
                        <>
                          <p>{invitation.chatName}</p>
                          <Button
                            onclick={async () => {
                              await chatInvitationService
                                .rejectChatInvitation(invitation.id)
                                .then(() => {
                                  noty.emit('onNotyAdded', {
                                    type: 'success',
                                    title: 'Invitation Cancelled',
                                    body: `Invitation to chat "${invitation.chatName}" cancelled!`,
                                  })
                                })
                                .catch((error) => {
                                  noty.emit('onNotyAdded', {
                                    type: 'error',
                                    title: 'Error Cancelling Invitation',
                                    body: <ErrorDisplay error={error} />,
                                  })
                                })
                            }}
                          >
                            ❌
                          </Button>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </Paper>
        ) : null}
      </>
    )
  },
})
