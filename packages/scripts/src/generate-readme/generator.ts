import * as shell from 'shelljs'
import { readFileSync } from 'fs'
import { buildTable } from './table'
import {
  AdapterPackage,
  AdapterSchema,
  EndpointDetails,
  IOMap,
  JsonObject,
  TableText,
  TextRow,
} from './types'

const localPathToRoot = '../../../../'

const templatePath = 'packages/scripts/src/generate-readme/template.md'

const envVarHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const endpointInputHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const inputParamHeaders: TextRow = ['Required?', 'Name', 'Type', 'Options', 'Default']

const testEnvOverrides = { RECORD: undefined, LOG_LEVEL: 'debug' }

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

const getJsonFile = (path: string): JsonObject => JSON.parse(readFileSync(path, 'utf-8'))

const checkFilePath = (filePath: string): string => {
  if (!shell.test('-f', filePath)) throw Error(`${filePath} is not a file`)
  else return filePath
}

const checkOptionalFilePath = (filePath: string): string => {
  return shell.test('-f', filePath) ? filePath : null
}

class ReadmeGenerator {
  packagePath: string
  adapterPath: string
  defaultEndpoint = ''
  endpointDetails: EndpointDetails = {}
  integrationTestPath: string
  readmePath: string
  schemaPath: string

  constructor(adapterPath: string) {
    if (!adapterPath.endsWith('/')) adapterPath += '/'

    if (!shell.test('-d', adapterPath)) throw Error(`${adapterPath} is not a directory`)

    this.packagePath = checkFilePath(adapterPath + 'package.json')
    this.schemaPath = checkFilePath(adapterPath + 'schemas/env.json')
    this.integrationTestPath = checkOptionalFilePath(
      adapterPath + 'test/integration/adapter.test.ts',
    )

    this.adapterPath = adapterPath
    this.readmePath = adapterPath + 'README.md'
  }

  async fetchImports(): Promise<void> {
    const endpointPath = checkFilePath(this.adapterPath + 'src/endpoint/index.ts')
    this.endpointDetails = await require(localPathToRoot + endpointPath)

    const configPath = checkFilePath(this.adapterPath + 'src/config.ts')
    this.defaultEndpoint = (await require(localPathToRoot + configPath)).DEFAULT_ENDPOINT ?? ''
  }

  buildReadme(): void {
    console.log('Generating README...')

    this.copyTemplate()
    this.addIntroSection()
    this.addEnvVarSection()
    this.addInputParamsSection()
    this.addEndpointSections()

    console.log(`README saved at: ${this.readmePath}`)
  }

  copyTemplate(): void {
    console.log('Copying template...')

    shell.cp(templatePath, this.readmePath)
  }

  addIntroSection(): void {
    console.log('Adding title and version...')

    const adapterPackage = getJsonFile(this.packagePath) as AdapterPackage
    shell.sed('-i', '\\$ADAPTER_NAME', adapterPackage.name, this.readmePath)
    shell.sed('-i', '\\$SEM_VER', adapterPackage.version, this.readmePath)
  }

  addEnvVarSection(): void {
    console.log('Adding environment variables...')

    const adapterSchema = getJsonFile(this.schemaPath) as AdapterSchema
    const envVars = adapterSchema.properties

    const tableText: TableText = Object.entries(envVars).map(([key, envVar]) => {
      const required = adapterSchema.required.includes(key) ? '✅' : ''
      const name = key ?? ''
      const type = envVar.type ?? ''
      const options = envVar.enum?.map((e) => e.toString()).join(', ') ?? ''
      const defaultText = envVar.default?.toString() ?? ''
      return [required, name, type, options, defaultText]
    })

    const envVarTable = tableText.length
      ? buildTable(tableText, envVarHeaders)
      : 'There are no environment variables for this adapter.'

    shell.sed('-i', '\\$ENV_VARS', envVarTable, this.readmePath)
  }

  addInputParamsSection(): void {
    console.log('Adding input parameters...')

    const endpointList = Object.keys(this.endpointDetails).map(
      (e) => `[${e}](#${e.replace(' ', '-')}-endpoint)`,
    )
    const tableText = [['', 'endpoint', 'string', endpointList.join(', '), this.defaultEndpoint]]

    const inputParamTable = tableText.length
      ? buildTable(tableText, inputParamHeaders)
      : 'There are no input parameters for this adapter.'

    shell.sed('-i', '\\$INPUT_PARAMS', inputParamTable, this.readmePath)
  }

  addEndpointSections(): void {
    console.log('Extracting example requests and responses...')

    // Fetch input/output examples
    let endpointIO = {}
    if (this.integrationTestPath) {
      const testOutput = shell
        .exec(`yarn test ${this.integrationTestPath}`, {
          fatal: true,
          silent: true,
          env: { ...process.env, ...testEnvOverrides },
        })
        .toString()

      const logObjects: JsonObject[][] = testOutput
        .split('\n')
        .reduce((ioPairs: JsonObject[][], consoleOut: string) => {
          try {
            const parsed = JSON.parse(consoleOut)
            if ('input' in parsed) ioPairs.push([parsed.input])
            else if ('output' in parsed && ioPairs[ioPairs.length - 1].length === 1)
              ioPairs[ioPairs.length - 1].push(parsed.output)
            return ioPairs
          } catch (e) {
            return ioPairs
          }
        }, [])

      endpointIO = logObjects.reduce((ioMap: IOMap, inOutPair) => {
        if (inOutPair.length === 2) {
          const endpoint = inOutPair[0]?.data?.endpoint ?? this.defaultEndpoint
          ioMap[endpoint] = ioMap[endpoint] ?? []
          ioMap[endpoint].push({ input: inOutPair[0], output: inOutPair[1] })
        }
        return ioMap
      }, {})
    }

    const endpointSections = Object.entries(this.endpointDetails)
      .map(([endpointName, endpointDetails]) => {
        console.log(`Adding ${endpointName} endpoint section...`)

        // Fetch section title
        const sectionTitle = `## ${capitalize(endpointName)} Endpoint\n\n`

        // Fetch input table
        const inputTableText: TableText = Object.entries(endpointDetails.inputParameters).map(
          ([pName, pDetails]) => {
            const required = Array.isArray(pDetails) || pDetails === true ? '✅' : ''
            const name = pName ?? ''
            const type = ''
            const options = Array.isArray(pDetails) ? pDetails.join(', ') : ''
            const defaultText = ''
            return [required, name, type, options, defaultText]
          },
        )

        const inputTable = inputTableText.length
          ? buildTable(inputTableText, endpointInputHeaders)
          : 'There are no input parameters for this endpoint.'

        const inputTableSection = '### Input Params\n\n' + inputTable + '\n\n'

        // Fetch supported endpoint text
        const endpointNames = endpointDetails.supportedEndpoints
        const supportedEndpointText =
          endpointNames.length > 1
            ? `Supported names for this endpoint are: ${endpointNames
                .map((e) => `\`${e}\``)
                .join(', ')}.\n\n`
            : endpointNames.length === 1
            ? `\`${endpointNames[0]}\` is the only supported name for this endpoint.\n\n`
            : 'There are no supported names for this endpoint.\n\n'

        // Fetch input/output text
        const ioExamples = []
        for (const supportedName of endpointDetails.supportedEndpoints) {
          if (supportedName in endpointIO) {
            for (const ioPair of endpointIO[supportedName]) {
              const { input, output } = ioPair
              const inputJson = JSON.stringify(input, null, 2)
              const outputJson = JSON.stringify(output, null, 2)
              ioExamples.push(
                `Request:\n\`\`\`json\n${inputJson}\n\`\`\`\n\nResponse:\n\`\`\`json\n${outputJson}\n\`\`\``,
              )
            }
          }
        }
        const ioExamplesText =
          '### Examples\n\n' +
          (ioExamples.length ? ioExamples.join('\n\n') : 'There are no examples for this endpoint.')

        return sectionTitle + supportedEndpointText + inputTableSection + ioExamplesText
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
