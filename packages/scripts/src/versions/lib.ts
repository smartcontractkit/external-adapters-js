import { getWorkspaceAdapters } from '../workspace'
import Console from 'console'
import Transform from 'stream'

function table(input: unknown[]) {
  const ts = new Transform.Transform({
    transform(chunk, _, cb) {
      cb(null, chunk)
    },
  })
  const logger = new Console.Console({ stdout: ts })
  logger.table(input)
  const table = (ts.read() || '').toString()
  let result = ''
  for (const row of table.split(/[\r\n]+/)) {
    let r = row.replace(/[^┬]*┬/, '┌')
    r = r.replace(/^├─*┼/, '├')
    r = r.replace(/│[^│]*/, '')
    r = r.replace(/^└─*┴/, '└')
    r = r.replace(/'/g, ' ')
    result += `${r}\n`
  }
  console.log(result)
}

export function printWorkspacePackages(): void {
  const workspacePackages = getWorkspaceAdapters(['core'])
  const packagesByType: { [type: string]: { 'Package Name': string; Version: string }[] } = {}

  for (const pkg of workspacePackages) {
    packagesByType[pkg.type] = [
      ...(packagesByType[pkg.type] || []),
      { 'Package Name': pkg.name, Version: pkg.version },
    ]
  }

  console.log('## Core packages')
  table(packagesByType.core)

  console.log('## Composite External Adapters')
  console.log('(Update all downstream adapters)')
  table(packagesByType.composites)

  console.log('## Source and Target External Adapters')
  const nonCompositeAdapters = [...packagesByType.sources, ...packagesByType.targets]
  nonCompositeAdapters.sort((a, b) => {
    if (a['Package Name'] < b['Package Name']) {
      return -1
    }
    if (a['Package Name'] > b['Package Name']) {
      return 1
    }

    return 0
  })
  table(nonCompositeAdapters)
}
