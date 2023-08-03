import { getWorkspaceAdapters, WorkspaceAdapter } from '../workspace'
import path from 'path'
import * as shell from 'shelljs'

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

export async function generate() {
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

export function writeJson(data: any) {
  const files = Object.keys(data)

  // write to each file
  files.forEach((f) => {
    let contents = data[f]
    if (f.includes('.json')) {
      contents = JSON.stringify(contents, null, 2)
    }
    shell.ShellString(contents).to(f)
  })
}
