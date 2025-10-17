import type { AppModelManifest } from 'common'

export const ChatAppManifest: AppModelManifest = {
  name: 'Chat',
  id: '@pi-rat/chat',
  apiRedirects: {}, // TODO: When externalized
  description: 'Simple chat application',
  version: '0.0.1',
  integrations: [],
  requiredPermissions: {},
}
