import { WorkspacePackage } from '../workspace'

/**
 * Ignore any collisions based on the keys in the bootstrap package
 */
export function getCollisionIgnoreMapFrom(pkg: WorkspacePackage): Record<string, true> {
  return Object.keys(pkg?.environment?.properties ?? {}).reduce<Record<string, true>>(
    (prev, next) => {
      prev[next] = true
      return prev
    },
    {},
  )
}

/**
 * Always rename adapter specific things such as "API_KEY"
 */
export const forceRenameMap = {
  API_KEY: true,
  RPC_URL: true,
  API_USERNAME: true,
  API_PASSWORD: true,
  API_ENDPOINT: true,
} as const

export const collisionPackageTypeMap = {
  // composites: true,
} as const
