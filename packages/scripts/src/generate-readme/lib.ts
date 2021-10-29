import * as shell from 'shelljs'
import { readFileSync } from 'fs'
import { buildTable } from './table'

const templatePath = 'packages/scripts/src/generate-readme/template.md'

const envVarHeaders = ['Required?', 'Name', 'Type', 'Options', 'Default']

function getReadmePath(adapterPath: string) {
  return adapterPath + 'README.md'
}

function getPackagePath(adapterPath: string) {
  return adapterPath + 'package.json'
}

function getSchemaPath(adapterPath: string) {
  return adapterPath + 'schemas/env.json'
}

function getJsonFile(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function addEnvVarSection(requiredEnvVars: any, envVars: any, readmePath: string) {
  const requiredEnvVarsMap = requiredEnvVars.reduce((map, key) => {
    map[key] = true
    return map
  }, {})

  const tableText = Object.keys(envVars).map((key) => {
    const envVar = envVars[key]
    const required = requiredEnvVarsMap[key] ? '✅' : ''
    const name = key ?? ''
    const type = envVar.type ?? ''
    const options = envVar.enum?.join(', ') ?? ''
    const defaultText = envVar.default ?? ''
    return [required, name, type, options, defaultText]
  })

  const envVarSection =
    '### Environment Variables\n\n' + buildTable(tableText, envVarHeaders) + '\n\n---'

  shell.sed('-i', '\\$ENV_VARS', envVarSection, readmePath)
}

function buildReadme(adapterPath: string) {
  const readmePath = getReadmePath(adapterPath)
  shell.cp(templatePath, readmePath)

  const adapterPackage = getJsonFile(getPackagePath(adapterPath))
  const adapterSchema = getJsonFile(getSchemaPath(adapterPath))

  shell.sed('-i', '\\$ADAPTER_NAME', adapterPackage.name, readmePath)
  shell.sed('-i', '\\$SEMVER', adapterPackage.version, readmePath)

  addEnvVarSection(adapterSchema.required, adapterSchema.properties, readmePath)
}

export function main(): void {
  let adapterPath = process.argv[2]

  if (!adapterPath.endsWith('/')) adapterPath += '/'

  if (!shell.test('-d', adapterPath)) {
    console.log(`${adapterPath} is not a directory`)
    return
  }
  if (!shell.test('-f', getPackagePath(adapterPath))) {
    console.log(`No package.json found in ${adapterPath}`)
    return
  }
  if (!shell.test('-f', getSchemaPath(adapterPath))) {
    console.log(`No schemas/env.json found in ${adapterPath}`)
    return
  }

  console.log('Generating README')

  buildReadme(adapterPath)

  console.log(`README saved at: ${getReadmePath(adapterPath)}`)
}
