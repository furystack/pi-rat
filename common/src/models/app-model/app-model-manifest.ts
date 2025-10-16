/**
 * Represents the structure of an application model within the system.
 */
export interface AppModelManifest {
  /**
   * An unique identifier for the app, e.g.: '@pi-rat/chat'
   */
  id: string

  /**
   * The user friendly display name of the app, e.g.: 'Chat'
   */
  name: string

  /**
   * The version of the app, e.g.: '1.0.0'
   */
  version: string

  /**
   * A short description of the app's functionality and purpose.
   */
  description: string

  /**
   * The required permissions for the app, e.g.: { userContext: ['read'], drives: ['read', 'write'], users: ['read'] }. The key is the subject (e.g., 'drives', 'users'), and the value is an array of actions (e.g., 'read', 'write').
   */
  requiredPermissions: Record<string, string[]>

  /**
   * A mapping of API endpoints that the app can interact with, e.g.: { '/chat': '/chat-public-api' }. The key is the public endpoint root, the value is the internal service endpoint root.
   */
  apiRedirects: Record<string, string>

  /**
   * A mapping of integration configurations for other apps. The key is the app's id, the value is the configuration object for that integration.
   * E.g.: { '@pi-rat/dashboard': {widgets: [{type: 'my-custom-widget', props: {...someCustomJsonSchema}}]} }
   */
  integrations: Record<string, any>
}
