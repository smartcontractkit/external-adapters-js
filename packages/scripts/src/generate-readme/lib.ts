import * as shell from 'shelljs'
import { readFileSync } from 'fs'

const scriptPath = 'packages/scripts/src/generate-readme/'
const templatePath = scriptPath + 'template.md'
const readmePath = scriptPath + 'README.md'
const exampleSourcePath = 'packages/examples/source/'
const examplePackagePath = exampleSourcePath + 'package.json'

const ADAPTER_NAME_REPLACE = '\\$ADAPTER_NAME'
const SEMVER_NUM_REPLACE = '\\$SEMVER'

function createReadme() {
  shell.cp(templatePath, readmePath)

  const examplePackage = getJsonFile(examplePackagePath)

  shell.sed('-i', ADAPTER_NAME_REPLACE, examplePackage.name, readmePath)
  shell.sed('-i', SEMVER_NUM_REPLACE, examplePackage.version, readmePath)

  console.log(shell.cat(readmePath).stdout)
}

function getJsonFile(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function main(): void {
  createReadme()
}
