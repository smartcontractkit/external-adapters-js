import * as fs from 'fs'
import { join } from 'path'
import * as s from 'shelljs'

export interface WorkspacePackage {
  location: string
  name: string
  descopedName: string
  type: string
  environment: string[]
  version: string
}

export const VALID_ADAPTER_TYPES = ['composites', 'sources', 'examples', 'targets']
const scope = '@chainlink/'

export type WorkspacePackages = ReturnType<typeof getWorkspacePackages>
export function getWorkspacePackages(additionalTypes: string[] = []): WorkspacePackage[] {
  const adapterTypes = VALID_ADAPTER_TYPES.concat(additionalTypes)
  return s
    .exec('yarn workspaces list --json')
    .split('\n')
    .filter(Boolean)
    .map((v) => JSON.parse(v))
    .map(({ location, name }: WorkspacePackage) => {
      const pkg: { version: string } = JSON.parse(
        fs.readFileSync(join(location, 'package.json'), 'utf-8'),
      )

      return {
        location,
        name,
        descopedName: name.replace(scope, ''),
        type: location.split('/')[1],
        environment: [],
        version: pkg.version,
      }
    })
    .filter((v) => adapterTypes.includes(v.type))
}
