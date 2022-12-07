/* eslint-disable @typescript-eslint/no-var-requires */
import fs, { readFileSync } from 'fs'
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
  framework: string
}

/**
 * Types of adapters that are publically consumed
 */
export const PUBLIC_ADAPTER_TYPES = [
  'composites',
  'sources',
  'examples',
  'targets',
  'non-deployable',
]
const scope = '@chainlink/'

export type WorkspacePackages = ReturnType<typeof getWorkspacePackages>

export function getWorkspacePackages(
  additionalTypes: string[] = [],
  changedFromBranch = '',
): WorkspacePackage[] {
  const adapterTypes = PUBLIC_ADAPTER_TYPES.concat(additionalTypes)

  return s
    .exec(
      changedFromBranch
        ? `yarn workspaces list --json --since=${changedFromBranch}`
        : 'yarn workspaces list --json',
      { silent: true },
    )
    .split('\n')
    .filter(Boolean)
    .map((v) => {
      console.log(v)
      return JSON.parse(v)
    })
    .map(({ location, name }: WorkspacePackage) => {
      console.log(location, name)
      const pkg: { version: string } = getJsonFile(join(location, 'package.json'))
      return {
        location,
        name,
        descopedName: name.replace(scope, ''),
        type: location.split('/')[1],
        version: pkg.version,
        framework: '2',
      }
    })
    .filter((v) => adapterTypes.includes(v.type))
    .map((p) => {
      let tsconf: TsConfig | undefined
      try {
        tsconf = getJsonFile(join(p.location, 'tsconfig.json'))
      } catch {
        warnLog(`${join(p.location, 'tsconfig.json')} does not exist`)
      }

      let environment: Record<string, string> | undefined
      const schemaPath = join(p.location, 'schemas/env.json')
      if (fs.existsSync(schemaPath)) {
        environment = getJsonFile(schemaPath)
      } else if (p.type === 'sources' || p.type === 'composites') {
        warnLog(
          `Could not find env.json for ${p.descopedName}, but package is a source or composite adapter. Flagging EA as a framework adapter`,
        )
        p.framework = '3'
      } else {
        warnLog(`${schemaPath} does not exist`)
      }

      return { ...p, tsconf, environment }
    })
}
function getJsonFile(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

/**
 * TODO: Use a proper debugging library like `debug`
 * @param str The string to log
 */
function warnLog(str: string) {
  if (process.env.DEBUG) {
    console.warn(str)
  }
}
