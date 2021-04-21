/* eslint-disable @typescript-eslint/no-var-requires */
import { readFileSync } from 'fs'
import { join } from 'path'
import * as s from 'shelljs'
interface TsConfig {
  references: { path: string }[]
}

export interface WorkspacePackage {
  tsconf: TsConfig | undefined
  location: string
  name: string
  descopedName: string
  type: string
  environment: Record<string, string> | undefined
  version: string
}

/**
 * Types of adapters that are publically consumed
 */
export const PUBLIC_ADAPTER_TYPES = ['composites', 'sources', 'examples', 'targets']
const scope = '@chainlink/'

export type WorkspacePackages = ReturnType<typeof getWorkspacePackages>
export function getWorkspacePackages(additionalTypes: string[] = []): WorkspacePackage[] {
  const adapterTypes = PUBLIC_ADAPTER_TYPES.concat(additionalTypes)
  return s
    .exec('yarn workspaces list --json')
    .split('\n')
    .filter(Boolean)
    .map((v) => JSON.parse(v))
    .map(({ location, name }: WorkspacePackage) => {
      const pkg: { version: string } = getJsonFile(join(location, 'package.json'))

      let tsconf: TsConfig | undefined
      try {
        tsconf = getJsonFile(join(location, 'tsconfig.json'))
      } catch {
        console.warn(`${join(location, 'tsconfig.json')} does not exist`)
      }

      let environment: Record<string, string> | undefined
      try {
        environment = getJsonFile(join(location, 'env.json'))
      } catch {
        console.warn(`${join(location, 'env.json')} does not exist`)
      }

      return {
        environment,
        tsconf,
        location,
        name,
        descopedName: name.replace(scope, ''),
        type: location.split('/')[1],
        version: pkg.version,
      }
    })
    .filter((v) => adapterTypes.includes(v.type))
}
function getJsonFile(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}
