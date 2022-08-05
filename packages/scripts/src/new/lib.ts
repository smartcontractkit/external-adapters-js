/* eslint-disable @typescript-eslint/no-var-requires */
import { green, red, blue, gray } from 'chalk'
import * as path from 'path'
import * as shell from 'shelljs'
import { getWorkspacePackages, WorkspacePackage } from '../workspace'
const { log } = console

const ADAPTER_TYPES = ['composite', 'source']

interface Inputs {
  type: string
  adapterName: string
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
  const type = process.argv[2]
  if (!type) throw red.bold('Missing first argument: type')
  if (!ADAPTER_TYPES.includes(type))
    throw red.bold(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)

  let adapterName: string = process.argv[3]
  if (!adapterName) throw red.bold('Missing second argument: name')

  const adapterDir = `packages/${type}s/${adapterName}`
  if (shell.ls(adapterDir)) {
    throw red.bold(`Cannot overwrite existing adapter: ${adapterDir}`)
  }

  //We will use the -adapter suffix when needed, so we remove it from the dev specified name if present so we don't end up with example-adapter-adapter in the code
  if (adapterName.endsWith('-adapter')) {
    adapterName = adapterName.replace('-adapter', '')
  }

  return { type, adapterName }
}

function copyFiles(type: string, adapterName: string) {
  const adapterDir = `packages/${type}s/${adapterName}`
  // copying files
  shell.mkdir(`packages/${type}s/${adapterName}`)
  shell.cp('-R', `packages/examples/${type}/*`, adapterDir)
  shell.rm('-rf', `${adapterDir}/dist`)

  //Replace anchors in files with variations
  const adapterNameFull = adapterName + '-adapter' //ex: "adapter-name-adapter", fills {{ADAPTER_NAME_FULL}}. Used in code in several places
  const adapterNameCapitalize = adapterName
    .split('-')
    .map((e) => e[0].toUpperCase() + e.slice(1))
    .join(' ') //ex: "Adapter Name", fills {{ADAPTER_NAME_CAPITALIZE}}. Used for titles, descriptions, and readmes
  const adapterNameAllCaps = adapterName.toUpperCase().replace('-', '_') //ex: "ADAPTER_NAME", fills {{ADAPTER_NAME_ALLCAPS}}. Only used in config/index.ts
  log(gray('Replacing placeholders with the adapter name...'))
  shell.ls(`${adapterDir}/**/*`).forEach((file: string) => {
    log(gray(`Replacing placeholders in ${file}`))
    shell.sed('-i', '{{ADAPTER_NAME}}', adapterName, file)
    shell.sed('-i', '{{ADAPTER_NAME_FULL}}', adapterNameFull, file)
    shell.sed('-i', '{{ADAPTER_NAME_FULL2}}', adapterNameFull, file) //Edge anchor to avoid a naming collision in examples/(composite|source)/package.json
    shell.sed('-i', '{{ADAPTER_NAME_CAPITALIZE}}', adapterNameCapitalize, file)
  })
  shell.sed(
    '-i',
    '{{ADAPTER_NAME_ALLCAPS}}',
    adapterNameAllCaps,
    `${adapterDir}/src/config/index.ts`,
  )
}

function tsconfGenerate(
  packages: WorkspacePackage[],
  filepath: string,
  slice = 0,
  isTestConfig = false,
) {
  return packages.map((w: WorkspacePackage) => {
    return {
      path: path
        .relative(filepath, `${w.location}${isTestConfig ? '/tsconfig.test.json' : ''}`)
        .slice(slice),
    } //removes first '.'
  })
}

async function generate(type: string) {
  let writeData = {} // data struct for writing

  // pull latest workspace data after files have been generated
  let currentWorkspace: WorkspacePackage[] = getWorkspacePackages(['scripts', 'core']) //using this alphabetizes everything
  currentWorkspace = currentWorkspace.filter((w) => w.name !== '@chainlink/ea-bootstrap') //filter out package
  const adapterList = currentWorkspace.filter((w) => w.type === `${type}s`)

  // add to ea legos package for source adapters
  if (type === 'source') {
    const legosPath = 'packages/core/legos'

    // update legos/tsconfig.json
    const legoTsconfigPath = `${legosPath}/tsconfig.json`
    const legoTsconfig = JSON.parse(
      JSON.stringify(require(path.relative(__dirname, legoTsconfigPath))),
    )
    legoTsconfig.references = tsconfGenerate(adapterList, legosPath)
    writeData = { ...writeData, [legoTsconfigPath]: legoTsconfig }

    // update legos/package.json
    const legoPackagePath = `${legosPath}/package.json`
    const legoPackage = JSON.parse(
      JSON.stringify(require(path.relative(__dirname, legoPackagePath))),
    )
    const otherPackages = Object.keys(legoPackage.dependencies)
      .filter((k) => !(k.includes('@chainlink') && k.includes('adapter')))
      .reduce((obj, key) => {
        return { ...obj, [key]: legoPackage.dependencies[key] }
      }, {}) // capture other dependencies (non-adapter)
    legoPackage.dependencies = adapterList.reduce((obj, adapter) => {
      return { ...obj, [adapter.name]: 'workspace:*' }
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
  const { type, adapterName } = checks()

  log(blue.bold(`Copying example ${type} adapter to ${type}/${adapterName}`))
  copyFiles(type, adapterName)

  log(blue.bold('Regenerating tsconfig and lego files'))
  const data = await generate(type)

  log(blue.bold('Resolving workspace and running prettier'))
  writeJson(data)

  log(green.bold(`Successfully generated ${adapterName} from the new adapter template`))
}
