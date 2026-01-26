import type { Roles } from './user.js'

/**
 * Metadata for a role (displayName, description)
 */
export type RoleMetadata = {
  /** Human-readable name for display in UI */
  displayName: string
  /** Brief description of what this role allows */
  description: string
}

/**
 * Full role definition including the name
 */
export type RoleDefinition = RoleMetadata & {
  /** Role name (matches values in Roles type) */
  name: Roles[number]
}

/**
 * All available roles in the system with their metadata.
 * Using Record<Roles[number], ...> ensures TS will error if a role is missing.
 */
export const AVAILABLE_ROLES: Record<Roles[number], RoleMetadata> = {
  admin: {
    displayName: 'Application Admin',
    description: 'Full system access including user management and all settings',
  },
  'media-manager': {
    displayName: 'Media Manager',
    description: 'Can manage movies, series, and encoding tasks',
  },
  viewer: {
    displayName: 'Viewer',
    description: 'Can browse and watch media content',
  },
  'iot-manager': {
    displayName: 'IoT Manager',
    description: 'Can manage IoT devices and their settings',
  },
}

/**
 * Helper to get full role definition by name
 */
export const getRoleDefinition = (name: Roles[number]): RoleDefinition => ({
  name,
  ...AVAILABLE_ROLES[name],
})

/**
 * Get all role definitions as an array (useful for dropdowns)
 */
export const getAllRoleDefinitions = (): RoleDefinition[] =>
  (Object.keys(AVAILABLE_ROLES) as Array<Roles[number]>).map(getRoleDefinition)
