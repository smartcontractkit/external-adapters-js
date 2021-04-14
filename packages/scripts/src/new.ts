import * as chalk from 'chalk'
import * as shell from 'shelljs'
const { red } = chalk
const { log } = console
import { getWorkspacePackages, WorkspacePackages, VALID_ADAPTER_TYPES } from './workspace'

function readJson(filepath: string) {
  return JSON.parse(shell.cat(filepath))
}

function writeJson(filepath: string, data: any) {
  shell.ShellString(JSON.stringify(data, null, 2)).to(filepath)
}

const ADAPTER_TYPES = ['composite', 'source']

function main() {
  const type: string = process.argv[2]
  if (!type) return log(red('Missing first argument: type'))
  if (!ADAPTER_TYPES.includes(type))
    return log(red(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`))

  const n: string = process.argv[3]
  if (!n) return log(red('Missing second argument: name'))

  // check if jq is installed (jq used later to modify json files)
  const jq: string = shell.exec('command -v jq').toString()
  if (!jq) return log(red('jq is not installed'))

  // copying files
  shell.mkdir(`packages/${type}s/${n}`)
  shell.cp('-R', `packages/examples/${type}/*`, `packages/${type}s/${n}`)

  // editing adapter package.json
  shell
    .cat(`packages/${type}s/${n}/package.json`)
    .exec(
      `jq '.name = "@chainlink/${n}-adapter" | .description = "Chainlink ${n} adapter." | .keywords += ["${n}"]'`,
    )
    .exec(`tee packages/${type}s/${n}/package.json`)
    .to(`packages/${type}s/${n}/package.json`)

  // changing README to use the adapter name instead of example
  const n_cap: string = n[0].toUpperCase() + n.slice(1)
  shell.sed('-i', 'Example', n_cap, `packages/${type}s/${n}/README.md`)

  // pull latest workspace data after files have been generated
  const current_workspace: WorkspacePackages = getWorkspacePackages() //using this alphabetizes everything
  const adapter_list = current_workspace.filter(w => w.type === `${type}s`)
  const adapter_names = adapter_list.map(w =>
    w.descopedName
      .split('-')
      .slice(0, -1)
      .join('-'),
  )

  // add to yarn workflow
  const github_path = '.github/strategy/adapters.json'
  const github_adapters = readJson(github_path)
  github_adapters[`${type}s`].adapter = adapter_names // only replace the target adapter type
  writeJson(github_path, github_adapters)

  // add to packages/tsconfig.json
  const tsconfig_path = 'packages/tsconfig.json'
  const tsconfig = readJson(tsconfig_path)
  const core = tsconfig.references.filter(
    (w: any) => !VALID_ADAPTER_TYPES.includes(w.path.split('/')[1]),
  ) // keep the scripts and core paths
  tsconfig.references = [
    ...core,
    ...current_workspace.map(w => {
      return { path: w.location.replace('packages', '.') }
    }),
  ] // keeps script and core paths at the front of array
  writeJson(tsconfig_path, tsconfig)

  const prettier_files = [github_path, tsconfig_path]

  // add to ea legos package for source adapters
  if (type === 'source') {
    const legos_path = 'packages/core/legos'

    // update legos/tsconfig.json
    const lego_tsconfig = readJson(`${legos_path}/tsconfig.json`)
    lego_tsconfig.references = adapter_list.map(w => {
      return { path: w.location.replace('packages', '../..') }
    })
    writeJson(`${legos_path}/tsconfig.json`, lego_tsconfig)

    // update legos/package.json
    const lego_package = readJson(`${legos_path}/package.json`)
    const other_packages = Object.keys(lego_package.dependencies)
      .filter(k => !(k.includes('@chainlink') && k.includes('adapter')))
      .reduce((obj, key) => {
        return { ...obj, [key]: lego_package.dependencies[key] }
      }, {}) // capture other dependencies (non-adapter)
    lego_package.dependencies = adapter_list.reduce((obj, adapter) => {
      return { ...obj, [adapter.name]: '*' }
    }, other_packages)
    writeJson(`${legos_path}/package.json`, lego_package)

    // updating legos/src/sources.ts
    // (not using workspaces because some have custom/non-standardized naming structures)
    let output = shell.cat(`${legos_path}/src/sources.ts`).split('\n')
    const index = output.indexOf('')
    const import_ea = output.slice(0, index)
    const export_ea = output.slice(index).filter(e => e !== '' && e !== '}' && !e.includes('{'))

    import_ea.push(`import * as ${n} from '@chainlink/${n}-adapter'`)
    export_ea.push(`  ${n},`)
    output = [...import_ea.sort(), '', 'export default {', ...export_ea.sort(), '}'] // create new file with alphabetically sorted EAs
    shell.ShellString(output.join('\n')).to(`${legos_path}/src/sources.ts`)

    prettier_files.push(`${legos_path}/src/sources.ts "${legos_path}/**/*.json"`)
  }

  // resolve workspace and format modified files
  shell.exec(`yarn && yarn prettier --write ${prettier_files.join(' ')}`)
}

main()
