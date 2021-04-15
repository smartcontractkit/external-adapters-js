import * as chalk from 'chalk'
import * as shell from 'shelljs'
const { red } = chalk
import { getWorkspacePackages, WorkspacePackage } from '../workspace'
import * as path from 'path'

const ADAPTER_TYPES = ['composite', 'source']

interface Inputs {
  type: string
  n: string
}

function readJson(filepath: string) {
  return JSON.parse(shell.cat(filepath))
}

function writeJson(data: any) {
  const files = Object.keys(data)

  // write to each file
  files.forEach(f => {
    let contents = data[f]
    if (f.includes('.json')) {
      contents = JSON.stringify(contents, null, 2)
    }
    shell.ShellString(contents).to(f)
  })

  // resolve workspace and format modified files
  shell.exec(`yarn && yarn prettier --write ${files.join(' ')}`)
}

function checks(): Inputs {
  const type: string = process.argv[2]
  if (!type) throw red('Missing first argument: type')
  if (!ADAPTER_TYPES.includes(type)) throw red(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)

  const n: string = process.argv[3]
  if (!n) throw red('Missing second argument: name')

  // check if jq is installed (jq used later to modify json files)
  const jq: string = shell.exec('command -v jq').toString()
  if (!jq) throw red('jq is not installed')

  return { type, n }
}

function copyFiles(type: string, n: string) {
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
  const nCap: string = n[0].toUpperCase() + n.slice(1)
  shell.sed('-i', 'Example', nCap, `packages/${type}s/${n}/README.md`)
}

function tsconfGenerate(packages: WorkspacePackage[], filepath: string, slice: number = 0) {
  return packages.map((w: WorkspacePackage) => {
    return { path: path.relative(filepath, w.location).slice(slice) } //removes first '.'
  })
}

function generate(type: string) {
  let writeData = {} // data struct for writing

  // pull latest workspace data after files have been generated
  let currentWorkspace: WorkspacePackage[] = getWorkspacePackages(['scripts', 'core']) //using this alphabetizes everything
  currentWorkspace = currentWorkspace.filter(w => w.name !== '@chainlink/types') //filter out package
  const adapterList = currentWorkspace.filter(w => w.type === `${type}s`)

  // add to packages/tsconfig.json
  const tsconfigPath = 'packages/tsconfig.json'
  const tsconfig = readJson(tsconfigPath)
  tsconfig.references = tsconfGenerate(currentWorkspace, tsconfigPath, 1)
  writeData = { ...writeData, [tsconfigPath]: tsconfig }

  // add to ea legos package for source adapters
  if (type === 'source') {
    const legosPath = 'packages/core/legos'

    // update legos/tsconfig.json
    const legoTsconfig = readJson(`${legosPath}/tsconfig.json`)
    legoTsconfig.references = tsconfGenerate(adapterList, legosPath)
    writeData = { ...writeData, [`${legosPath}/tsconfig.json`]: legoTsconfig }

    // update legos/package.json
    const legoPackage = readJson(`${legosPath}/package.json`)
    const otherPackages = Object.keys(legoPackage.dependencies)
      .filter(k => !(k.includes('@chainlink') && k.includes('adapter')))
      .reduce((obj, key) => {
        return { ...obj, [key]: legoPackage.dependencies[key] }
      }, {}) // capture other dependencies (non-adapter)
    legoPackage.dependencies = adapterList.reduce((obj, adapter) => {
      return { ...obj, [adapter.name]: '*' }
    }, otherPackages)
    writeData = { ...writeData, [`${legosPath}/package.json`]: legoPackage }

    // updating legos/src/sources.ts
    // (not using workspaces because some have custom/non-standardized naming structures)
    let output = shell.cat(`${legosPath}/src/sources.ts`).split('\n')
    const index = output.indexOf('')
    const importEa = output.slice(0, index)
    const exportEa = output.slice(index).filter(e => e !== '' && e !== '}' && !e.includes('{'))

    // checks adapter list for newly generated adapters and adds to the list if not already present
    adapterList.forEach(a => {
      if (!importEa.join().includes(a.name)) {
        const name = a.name
          .replace('@chainlink/', '')
          .replace('-adapter', '')
        const nameNoDash = name.replace(/-/g, '_') // /g to apply to whole string not just first instance

        importEa.push(`import * as ${nameNoDash} from '@chainlink/${name}-adapter'`)
        exportEa.push(`  ${nameNoDash},`)
      }
    })

    output = [...importEa.sort(), '', 'export default {', ...exportEa.sort(), '}'] // create new file with alphabetically sorted EAs
    writeData = { ...writeData, [`${legosPath}/src/sources.ts`]: output.join('\n') }
  }
  return writeData
}

export function main() {
  const inputs: Inputs = checks()
  copyFiles(inputs.type, inputs.n)
  writeJson(generate(inputs.type))
}
