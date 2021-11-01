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

const endpointInputHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const exampleEndpointInputTable: TableText = [
  ['✅', '`base`, `from`, or `coin`', 'Symbol of the currency to query', '`BTC`, `ETH`, `USD`', ''],
  [
    '✅',
    '`quote`, `to`, or `market`',
    'Symbol of the currency to convert to',
    '`BTC`, `ETH`, `USD`',
    '',
  ],
]

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

function getEndpointIndexPath(adapterPath: string): string {
  return adapterPath + 'src/endpoint/index.ts'
}

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

function addEndpointSections(endpointIndexPath: string, readmePath: string): void {
  const indexStr = shell.cat(endpointIndexPath)
  const lines = indexStr.stdout.split('\n')
  const endpoints = lines.map((s) => s.split(' ')[3])

  const endpointSections = endpoints
    .map(
      (e) =>
        `### ${capitalize(e)} Endpoint\n\n` +
        `Example description of ${e} endpoint\n\n` +
        '### Input Params\n\n' +
        buildTable(exampleEndpointInputTable, endpointInputHeaders) +
        '\n\n### Sample Input\n\n A sample of endpoint input\n\n' +
        '### Sample Output\n\n A sample of endpoint output\n',
    )
    .join('\n\n')

  shell.sed('-i', '\\$ENDPOINT_SECTIONS', endpointSections, readmePath)
}

function buildReadme(adapterPath: string): void {
  const readmePath = getReadmePath(adapterPath)
  shell.cp(templatePath, readmePath)

  // Add Title and Version #
  const adapterPackage = getJsonFile(getPackagePath(adapterPath)) as AdapterPackage
  shell.sed('-i', '\\$ADAPTER_NAME', adapterPackage.name, readmePath)
  shell.sed('-i', '\\$SEMVER', adapterPackage.version, readmePath)

  // Add Env Vars Section
  const adapterSchema = getJsonFile(getSchemaPath(adapterPath)) as AdapterSchema
  addEnvVarSection(adapterSchema.required, adapterSchema.properties, readmePath)

  // Add Endpoint Sections
  const endpointIndexPath = getEndpointIndexPath(adapterPath)
  addEndpointSections(endpointIndexPath, readmePath)
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
