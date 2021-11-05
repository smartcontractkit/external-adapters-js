import * as shell from 'shelljs'
import { readFileSync } from 'fs'
import { buildTable } from './table'
import {
  AdapterPackage,
  AdapterSchema,
  EndpointDetails,
  JsonObject,
  TableText,
  TextRow,
} from './types'

const localPathToRoot = '../../../../'

const templatePath = 'packages/scripts/src/generate-readme/template.md'

const envVarHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const endpointInputHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const inputParamHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

const getJsonFile = (path: string): JsonObject => JSON.parse(readFileSync(path, 'utf-8'))

const checkFilePath = (filePath: string): string => {
  if (!shell.test('-f', filePath)) throw Error(`${filePath} is not a file`)
  else return filePath
}

class ReadmeGenerator {
  adapterPackage: AdapterPackage
  adapterPath: string
  adapterSchema: AdapterSchema
  defaultEndpoint = ''
  endpointDetails: EndpointDetails = {}
  readmePath: string

  constructor(adapterPath: string) {
    if (!adapterPath.endsWith('/')) adapterPath += '/'

    if (!shell.test('-d', adapterPath)) throw Error(`${adapterPath} is not a directory`)

    const packagePath = checkFilePath(adapterPath + 'package.json')
    const schemaPath = checkFilePath(adapterPath + 'schemas/env.json')

    this.adapterPath = adapterPath
    this.adapterPackage = getJsonFile(packagePath) as AdapterPackage
    this.adapterSchema = getJsonFile(schemaPath) as AdapterSchema
    this.readmePath = adapterPath + 'README.md'
  }

  async fetchImports(): Promise<void> {
    const endpointPath = checkFilePath(this.adapterPath + 'src/endpoint/index.ts')
    this.endpointDetails = await require(localPathToRoot + endpointPath)

    const configPath = checkFilePath(this.adapterPath + 'src/config.ts')
    this.defaultEndpoint = (await require(localPathToRoot + configPath)).DEFAULT_ENDPOINT
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
    const endpointList = Object.keys(this.endpointDetails).map(
      (e) => `[${e}](#${e.replace(' ', '-')}-endpoint)`,
    )
    const tableText = [['', 'endpoint', 'string', endpointList.join(', '), this.defaultEndpoint]]

    const inputParamTable = buildTable(tableText, inputParamHeaders)

    shell.sed('-i', '\\$INPUT_PARAMS', inputParamTable, this.readmePath)
  }

  addEndpointSections(): void {
    const endpointSections = Object.entries(this.endpointDetails)
      .map(([eName, eDetails]) => {
        const tableText: TableText = Object.entries(eDetails.inputParameters).map(
          ([pName, pDetails]) => {
            const required = Array.isArray(pDetails) || pDetails === true ? '✅' : ''
            const name = pName ?? ''
            const type = ''
            const options = Array.isArray(pDetails) ? pDetails.join(', ') : ''
            const defaultText = ''
            return [required, name, type, options, defaultText]
          },
        )

        const endpointNames = eDetails.supportedEndpoints
        const supportedEndpointText =
          endpointNames.length > 1
            ? `Supported names for this endpoint are: ${endpointNames
                .map((e) => `\`${e}\``)
                .join(', ')}.`
            : `\`${endpointNames[0]}\` is the only supported name for this endpoint.`

        return (
          `## ${capitalize(eName)} Endpoint\n\n` +
          `${supportedEndpointText}\n\n` +
          '### Input Params\n\n' +
          buildTable(tableText, endpointInputHeaders) +
          '\n\n### Sample Input\n\nA sample of endpoint input\n\n' +
          '### Sample Output\n\nA sample of endpoint output'
        )
      })
      .join('\n\n')

    shell.sed('-i', '\\$ENDPOINT_SECTIONS', endpointSections, this.readmePath)
  }
}

export async function main(): Promise<void> {
  try {
    const adapterPath = process.argv[2]

    const readmeGenerator = new ReadmeGenerator(adapterPath)

    await readmeGenerator.fetchImports() // Must fetch imports as separate step, since dynamic imports are
    // async but constructor cannot contain async code
    readmeGenerator.buildReadme()
  } catch (e) {
    console.log(`Error: ${e}`)
    return
  }
}
