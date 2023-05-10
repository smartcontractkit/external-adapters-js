/* eslint-disable @typescript-eslint/no-var-requires */
import chalk from 'chalk'
import * as path from 'path'
import * as shell from 'shelljs'
import { getWorkspaceAdapters, WorkspaceAdapter } from '../workspace'
const { red, blue } = chalk
const { log } = console

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

  // clear the CHANGELOG
  shell.echo(`# @chainlink/${n}-adapter\n`).to(`packages/${type}s/${n}/CHANGELOG.md`)

  // set the new adapter version to 0.0.0
  shell.sed(
    '-i',
    '"version": ".+?(?=",)',
    '"version": "0.0.0',
    `packages/${type}s/${n}/package.json`,
  )

  // changing README to use the adapter name instead of example
  const nCap: string = n[0].toUpperCase() + n.slice(1)
  shell.sed('-i', 'Example', nCap, `packages/${type}s/${n}/README.md`)
}

function tsconfGenerate(
  packages: WorkspaceAdapter[],
  filepath: string,
  slice = 0,
  isTestConfig = false,
) {
  return packages.map((w: WorkspaceAdapter) => {
    return {
      path: path
        .relative(filepath, `${w.location}${isTestConfig ? '/tsconfig.test.json' : ''}`)
        .slice(slice),
    } //removes first '.'
  })
}

async function generate() {
  let writeData = {} // data struct for writing

  // pull latest workspace data after files have been generated
  let currentWorkspace: WorkspaceAdapter[] = getWorkspaceAdapters(['scripts', 'core']) //using this alphabetizes everything
  currentWorkspace = currentWorkspace.filter((w) => w.name !== '@chainlink/ea-bootstrap') //filter out package
  currentWorkspace = currentWorkspace.filter((w) => w.name !== '@chainlink/readme-test-adapter') //filter out package

  // add to packages/tsconfig.json
  const tsconfigPath = 'packages/tsconfig.json'
  const tsconfig = JSON.parse(JSON.stringify(require(path.relative(__dirname, tsconfigPath))))
  tsconfig.references = tsconfGenerate(currentWorkspace, tsconfigPath, 1)
  writeData = { ...writeData, [tsconfigPath]: tsconfig }

  // add to packages/tsconfig.test.json
  const tsconfigTestPath = 'packages/tsconfig.test.json'
  const tsconfigTest = JSON.parse(
    JSON.stringify(require(path.relative(__dirname, tsconfigTestPath))),
  )
  tsconfigTest.references = tsconfGenerate(currentWorkspace, tsconfigTestPath, 1, true)
  writeData = { ...writeData, [tsconfigTestPath]: tsconfigTest }

  return writeData
}

export async function main(): Promise<void> {
  log(blue.bold('Running input checks'))
  const inputs: Inputs = checks()

  log(blue.bold(`Copying example ${inputs.type} adapter to ${inputs.type}/${inputs.n}`))
  copyFiles(inputs.type, inputs.n)

  log(blue.bold('Regenerating tsconfig and lego files'))
  const data = await generate()

  log(blue.bold('Resolving workspace and running prettier'))
  writeJson(data)
}
