import * as shell from 'shelljs'
import { readFileSync } from 'fs'
import { buildTable } from './table'
import {
  AdapterPackage,
  AdapterSchema,
  JsonObject,
  SchemaProperties,
  SchemaRequired,
  TableText,
  TextRow,
} from './types'

const templatePath = 'packages/scripts/src/generate-readme/template.md'

const envVarHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

function getReadmePath(adapterPath: string): string {
  return adapterPath + 'README.md'
}

function getPackagePath(adapterPath: string): string {
  return adapterPath + 'package.json'
}

function getSchemaPath(adapterPath: string): string {
  return adapterPath + 'schemas/env.json'
}

function getJsonFile(path: string): JsonObject {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function addEnvVarSection(
  requiredEnvVars: SchemaRequired,
  envVars: SchemaProperties,
  readmePath: string,
): void {
  const tableText: TableText = Object.keys(envVars).map((key) => {
    const envVar = envVars[key]
    const required = requiredEnvVars.includes(key) ? '✅' : ''
    const name = key ?? ''
    const type = envVar.type ?? ''
    const options = envVar.enum?.map((e) => e.toString()).join(', ') ?? ''
    const defaultText = envVar.default?.toString() ?? ''
    return [required, name, type, options, defaultText]
  })

  const envVarSection =
    '### Environment Variables\n\n' + buildTable(tableText, envVarHeaders) + '\n\n---'

  shell.sed('-i', '\\$ENV_VARS', envVarSection, readmePath)
}

function buildReadme(adapterPath: string): void {
  const readmePath = getReadmePath(adapterPath)
  shell.cp(templatePath, readmePath)

  const adapterPackage = getJsonFile(getPackagePath(adapterPath)) as AdapterPackage
  const adapterSchema = getJsonFile(getSchemaPath(adapterPath)) as AdapterSchema

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
