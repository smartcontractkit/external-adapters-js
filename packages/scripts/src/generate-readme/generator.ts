import * as shell from 'shelljs'
import { readFileSync } from 'fs'
import { buildTable } from './table'
import { AdapterPackage, AdapterSchema, JsonObject, TableText, TextRow } from './types'

const templatePath = 'packages/scripts/src/generate-readme/template.md'

const envVarHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const endpointInputHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const inputParamHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

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

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

const getJsonFile = (path: string): JsonObject => JSON.parse(readFileSync(path, 'utf-8'))

class ReadmeGenerator {
  adapterPackage: AdapterPackage
  adapterPath: string
  adapterSchema: AdapterSchema
  endpoints: string[]
  readmePath: string

  constructor(adapterPath: string) {
    if (!adapterPath.endsWith('/')) adapterPath += '/'

    if (!shell.test('-d', adapterPath)) throw Error(`${adapterPath} is not a directory`)

    const endpointIndexPath = adapterPath + 'src/endpoint/index.ts'
    if (!shell.test('-f', endpointIndexPath))
      throw Error(`No src/endpoint/index.ts found in ${adapterPath}`)

    const packagePath = adapterPath + 'package.json'
    if (!shell.test('-f', packagePath)) throw Error(`No package.json found in ${adapterPath}`)

    const schemaPath = adapterPath + 'schemas/env.json'
    if (!shell.test('-f', schemaPath)) throw Error(`No schemas/env.json found in ${adapterPath}`)

    this.adapterPath = adapterPath
    this.adapterPackage = getJsonFile(packagePath) as AdapterPackage
    this.adapterSchema = getJsonFile(schemaPath) as AdapterSchema
    this.readmePath = adapterPath + 'README.md'

    // Get list of endpoints
    const indexStr = shell.cat(endpointIndexPath)
    const lines = indexStr.stdout.split('\n')
    this.endpoints = lines.filter((s) => s.length).map((s) => s.split(' ')[3])
  }

  buildReadme(): void {
    console.log('Generating README')

    this.copyTemplate()
    this.addIntroSection()
    this.addEnvVarSection()
    this.addInputParamsSection()
    this.addEndpointSections()

    console.log(`README saved at: ${this.readmePath}`)
  }

  copyTemplate(): void {
    shell.cp(templatePath, this.readmePath)
  }

  addIntroSection(): void {
    shell.sed('-i', '\\$ADAPTER_NAME', this.adapterPackage.name, this.readmePath)
    shell.sed('-i', '\\$SEM_VER', this.adapterPackage.version, this.readmePath)
  }

  addEnvVarSection(): void {
    const envVars = this.adapterSchema.properties

    const tableText: TableText = Object.entries(envVars).map(([key, envVar]) => {
      const required = this.adapterSchema.required.includes(key) ? '✅' : ''
      const name = key ?? ''
      const type = envVar.type ?? ''
      const options = envVar.enum?.map((e) => e.toString()).join(', ') ?? ''
      const defaultText = envVar.default?.toString() ?? ''
      return [required, name, type, options, defaultText]
    })

    const envVarTable = buildTable(tableText, envVarHeaders)

    shell.sed('-i', '\\$ENV_VARS', envVarTable, this.readmePath)
  }

  addInputParamsSection(): void {
    const endpointList = this.endpoints.map((e) => `[${e}](#${e.replace(' ', '-')}-endpoint)`)
    const tableText = [['', 'endpoint', 'string', endpointList.join(', '), 'example']]

    const inputParamTable = buildTable(tableText, inputParamHeaders)

    shell.sed('-i', '\\$INPUT_PARAMS', inputParamTable, this.readmePath)
  }

  addEndpointSections(): void {
    const endpointSections = this.endpoints
      .map(
        (e) =>
          `## ${capitalize(e)} Endpoint\n\n` +
          `Example description of ${e} endpoint\n\n` +
          '### Input Params\n\n' +
          buildTable(exampleEndpointInputTable, endpointInputHeaders) +
          '\n\n### Sample Input\n\nA sample of endpoint input\n\n' +
          '### Sample Output\n\nA sample of endpoint output',
      )
      .join('\n\n')

    shell.sed('-i', '\\$ENDPOINT_SECTIONS', endpointSections, this.readmePath)
  }
}

export function main(): void {
  try {
    const adapterPath = process.argv[2]

    const readmeGenerator = new ReadmeGenerator(adapterPath)

    readmeGenerator.buildReadme()
  } catch (e) {
    console.log(`Error: ${e}`)
    return
  }
}
