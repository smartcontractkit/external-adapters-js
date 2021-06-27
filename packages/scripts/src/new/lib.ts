import * as chalk from 'chalk'
import * as shell from 'shelljs'
const { red, blue } = chalk
const { log } = console
import { getWorkspacePackages, WorkspacePackage } from '../workspace'
import * as path from 'path'

const ADAPTER_TYPES = ['composite', 'source']

interface Inputs {
  type: string
  n: string
}

function writeJson(data: any) {
  const files = Object.keys(data)

  // write to each file
  files.forEach((f) => {
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
  if (!type) throw red.bold('Missing first argument: type')
  if (!ADAPTER_TYPES.includes(type))
    throw red.bold(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)

  const n: string = process.argv[3]
  if (!n) throw red.bold('Missing second argument: name')

  // check if jq is installed (jq used later to modify json files)
  const jq: string = shell.exec('command -v jq').toString()
  if (!jq) throw red.bold('jq is not installed')

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

function tsconfGenerate(packages: WorkspacePackage[], filepath: string, slice = 0) {
  return packages.map((w: WorkspacePackage) => {
    return { path: path.relative(filepath, w.location).slice(slice) } //removes first '.'
  })
}

async function generate(type: string, n: string) {
  let writeData = {} // data struct for writing

  // pull latest workspace data after files have been generated
  let currentWorkspace: WorkspacePackage[] = getWorkspacePackages(['scripts', 'core']) //using this alphabetizes everything
  currentWorkspace = currentWorkspace.filter((w) => w.name !== '@chainlink/types') //filter out package
  const adapterList = currentWorkspace.filter((w) => w.type === `${type}s`)

  // add to packages/tsconfig.json
  const tsconfigPath = 'packages/tsconfig.json'
  const tsconfig = await import(path.relative(__dirname, tsconfigPath))
  tsconfig.references = tsconfGenerate(currentWorkspace, tsconfigPath, 1)
  writeData = { ...writeData, [tsconfigPath]: tsconfig }

  // add to github CI/CD
  const githubPath = '.github/strategy/adapters.json'
  const github = await import(path.relative(__dirname, githubPath))
  github[`${type}s`].adapter.push(n)
  github[`${type}s`].adapter.sort()
  writeData = { ...writeData, [githubPath]: github }

  // add to ea legos package for source adapters
  if (type === 'source') {
    const legosPath = 'packages/core/legos'

    // update legos/tsconfig.json
    const legoTsconfigPath = `${legosPath}/tsconfig.json`
    const legoTsconfig = await import(path.relative(__dirname, legoTsconfigPath))
    legoTsconfig.references = tsconfGenerate(adapterList, legosPath)
    writeData = { ...writeData, [legoTsconfigPath]: legoTsconfig }

    // update legos/package.json
    const legoPackagePath = `${legosPath}/package.json`
    const legoPackage = await import(path.relative(__dirname, legoPackagePath))
    const otherPackages = Object.keys(legoPackage.dependencies)
      .filter((k) => !(k.includes('@chainlink') && k.includes('adapter')))
      .reduce((obj, key) => {
        return { ...obj, [key]: legoPackage.dependencies[key] }
      }, {}) // capture other dependencies (non-adapter)
    legoPackage.dependencies = adapterList.reduce((obj, adapter) => {
      return { ...obj, [adapter.name]: '*' }
    }, otherPackages)
    writeData = { ...writeData, [legoPackagePath]: legoPackage }

    // updating legos/src/sources.ts
    // (not using workspaces because some have custom/non-standardized naming structures)
    const legoSourcePath = `${legosPath}/src/sources.ts`
    let output = shell.cat(legoSourcePath).split('\n')
    const index = output.indexOf('')
    const importEa = output.slice(0, index)
    const exportEa = output.slice(index).filter((e) => e !== '' && e !== '}' && !e.includes('{'))

    // checks adapter list for newly generated adapters and adds to the list if not already present
    adapterList.forEach((a) => {
      if (!importEa.join().includes(a.name)) {
        const name = a.name.replace('@chainlink/', '').replace('-adapter', '')
        const nameNoDash = name.replace(/-/g, '_') // /g to apply to whole string not just first instance

        importEa.push(`import * as ${nameNoDash} from '@chainlink/${name}-adapter'`)
        exportEa.push(`  ${nameNoDash},`)
      }
    })

    output = [...importEa.sort(), '', 'export default {', ...exportEa.sort(), '}'] // create new file with alphabetically sorted EAs
    writeData = { ...writeData, [legoSourcePath]: output.join('\n') }
  }
  return writeData
}

export async function main() {
  log(blue.bold('Running input checks'))
  const inputs: Inputs = checks()

  log(blue.bold(`Copying example ${inputs.type} adapter to ${inputs.type}/${inputs.n}`))
  copyFiles(inputs.type, inputs.n)

  log(blue.bold('Regenerating tsconfig and lego files'))
  const data = await generate(inputs.type, inputs.n)

  log(blue.bold('Resolving workspace and running prettier'))
  writeJson(data)
}
