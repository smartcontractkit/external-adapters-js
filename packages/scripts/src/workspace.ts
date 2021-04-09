import * as fs from 'fs'
import { join } from 'path'
import * as s from 'shelljs'

interface WorkspacePackage {
  location: string
  name: string
}

const VALID_ADAPTER_TYPES = ['composites', 'sources', 'examples', 'targets']
const scope = '@chainlink/'

export type WorkspacePackages = ReturnType<typeof getWorkspacePackages>
export function getWorkspacePackages() {
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
    .filter((v) => VALID_ADAPTER_TYPES.includes(v.type))
}
