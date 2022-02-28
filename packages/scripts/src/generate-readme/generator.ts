import * as shell from 'shelljs'
import { buildTable } from './table'
import { balance } from '@chainlink/ea-factories'
import { getBalanceTable, inputParamHeaders, paramHeaders } from './tableAssets'
import { EndpointDetails, EnvVars, IOMap, JsonObject, Package, Schema, TableText } from './types'

const localPathToRoot = '../../../../'

const testEnvOverrides = {
  // API_VERBOSE: undefined,
  API_VERBOSE: 'true',
  EA_PORT: '0',
  LOG_LEVEL: 'debug',
  NODE_ENV: undefined,
  RECORD: undefined,
  WS_ENABLED: undefined,
}

const TRUNCATE_LINES = 500

// Note: genSig and genSigGrep parsed text must match
const genSig =
  'This README was generated automatically. Please see [scripts](../../scripts) for more info.'

const exampleTextHeader = '### Example\n'

const noExampleText = 'There are no examples for this endpoint.'

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

const wrapJson = (o: string): string => `\`\`\`json\n${o}\n\`\`\``

const wrapCode = (s: string | number = ''): string => `\`${s.toString()}\``

const codeList = (a: (string | number)[] = []): string =>
  a
    .sort()
    .map((d) => wrapCode(d))
    .join(', ')

export const getJsonFile = (path: string): JsonObject => JSON.parse(shell.cat(path).toString())

const checkFilePaths = (filePaths: string[]): string => {
  for (const filePath of filePaths) {
    if (shell.test('-f', filePath)) return filePath
  }
  throw Error(`No file found in the following paths: ${filePaths.join(',')}`)
}

export class ReadmeGenerator {
  schemaDescription: string
  adapterPath: string
  defaultEndpoint = ''
  endpointDetails: EndpointDetails = {}
  envVars: EnvVars
  integrationTestPath: string | null
  name: string
  readmeText = ''
  requiredEnvVars: string[]
  skipTests: boolean
  verbose: boolean
  version: string

  constructor(adapterPath: string, verbose = false, skipTests = false) {
    this.verbose = verbose

    if (!adapterPath.endsWith('/')) adapterPath += '/'

    if (!shell.test('-d', adapterPath)) throw Error(`${adapterPath} is not a directory`)

    if (verbose) console.log(`${adapterPath}: Checking package.json`)

    const packagePath = checkFilePaths([adapterPath + 'package.json'])
    const packageJson = getJsonFile(packagePath) as Package
    this.version = packageJson.version ?? ''

    if (verbose) console.log(`${adapterPath}: Checking schema/env.json`)

    const schemaPath = checkFilePaths([adapterPath + 'schemas/env.json'])
    const schema = getJsonFile(schemaPath) as Schema
    this.schemaDescription = schema.description ?? ''
    this.name = schema.title ?? packageJson.name ?? ''
    this.envVars = schema.properties ?? {}
    this.requiredEnvVars = schema.required ?? []

    this.adapterPath = adapterPath
    this.skipTests = skipTests
    this.integrationTestPath = adapterPath + 'test/integration/*.test.ts'
  }

  async fetchImports(): Promise<void> {
    // Fetch imports as separate step, since dynamic imports are async but constructor can't contain async code

    if (this.verbose) console.log(`${this.adapterPath}: Importing src/config/index.ts`)

    const configPath = checkFilePaths([
      this.adapterPath + 'src/config.ts',
      this.adapterPath + 'src/config/index.ts',
    ])
    this.defaultEndpoint = (await require(localPathToRoot + configPath)).DEFAULT_ENDPOINT

    if (this.verbose) console.log(`${this.adapterPath}: Importing src/endpoint/index.ts`)

    const endpointPath = checkFilePaths([this.adapterPath + 'src/endpoint/index.ts'])
    this.endpointDetails = await require(localPathToRoot + endpointPath)
  }

  buildReadme(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Generating README text`)

    this.addIntroSection()
    this.addEnvVarSection()
    this.addInputParamsSection()
    this.addEndpointSections()

    console.log(`${this.adapterPath}: README has been generated (unsaved)`)
  }

  addIntroSection(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Adding title and version`)

    this.readmeText = `# ${this.name}\n\nVersion: ${this.version}\n\n`
    if (this.schemaDescription) this.readmeText += `${this.schemaDescription}\n\n`
    this.readmeText += `${genSig}\n\n`
  }

  addEnvVarSection(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Adding environment variables`)

    const envVars = this.envVars

    const tableText: TableText = Object.entries(envVars).map(([key, envVar]) => {
      const required = this.requiredEnvVars.includes(key) ? '✅' : ''
      const name = key ?? ''
      const description = envVar.description ?? ''
      const type = envVar.type ?? ''
      const options = codeList(envVar.options)
      const defaultText = Object.keys(envVar).includes('default') ? wrapCode(envVar.default) : ''
      return [required, name, description, type, options, defaultText]
    })

    const envVarTable = tableText.length
      ? buildTable(tableText, paramHeaders)
      : 'There are no environment variables for this adapter.'

    this.readmeText += `## Environment Variables\n\n${envVarTable}\n\n---\n\n`
  }

  addInputParamsSection(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Adding input parameters`)

    const endpointList = Object.keys(this.endpointDetails).reduce((list: string[], e) => {
      const { supportedEndpoints = [] } = this.endpointDetails[e]
      for (const supportedEndpoint of supportedEndpoints) {
        list.push(`[${supportedEndpoint}](#${e.toLowerCase()}-endpoint)`)
      }
      return list
    }, [])

    const tableText = [
      [
        '',
        'endpoint',
        'The endpoint to use',
        'string',
        endpointList.sort().join(', '),
        this.defaultEndpoint ? wrapCode(this.defaultEndpoint) : '',
      ],
    ]

    const inputParamTable = tableText.length
      ? buildTable(tableText, paramHeaders)
      : 'There are no input parameters for this adapter.'

    this.readmeText += `## Input Parameters\n\n${inputParamTable}\n\n---\n\n`
  }

  addEndpointSections(): void {
    // Store I/O Examples for each endpoint
    const endpointExampleText: { [endpoint: string]: string } = {}
    if (this.skipTests) {
      // If skipping tests, pull from existing README
      if (this.verbose)
        console.log(`${this.adapterPath}: Pulling I/O examples from existing README`)

      const currentReadmeText = shell.cat(this.adapterPath + 'README.md').toString()

      let regex: RegExp
      const defaultText = exampleTextHeader + noExampleText
      for (const endpointName of Object.keys(this.endpointDetails)) {
        regex = new RegExp(
          `## ${capitalize(endpointName)} Endpoint(\n|.)*?(?<text>### Example(\n|.)*?)\n\n---`,
        )

        endpointExampleText[endpointName] =
          currentReadmeText.match(regex)?.groups?.text ?? defaultText
      }
    } else {
      // If not skipping tests, run through yarn test with testEnvOverrides variables
      if (this.verbose)
        console.log(`${this.adapterPath}: Running integration tests to get updated I/O examples`)

      const testOutput = shell
        .exec(`yarn test ${this.integrationTestPath}`, {
          fatal: true,
          silent: true,
          env: { ...process.env, ...testEnvOverrides },
        })
        .toString()

      if (this.verbose) console.log(`${this.adapterPath}: Processing example data`)

      // Pull out paired input/outputs from test logs. Assumes no "output" will print
      // without its corresponding "input" printed beforehand
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

      // Filter and parse collected I/O pairs
      const endpointIO = logObjects.reduce((ioMap: IOMap, inOutPair) => {
        if (inOutPair.length === 2) {
          const endpoint = inOutPair[0]?.data?.endpoint ?? this.defaultEndpoint
          ioMap[endpoint] = ioMap[endpoint] ?? []
          ioMap[endpoint].push({ input: inOutPair[0], output: inOutPair[1] })
        }
        return ioMap
      }, {})

      // Build final text for examples
      for (const [endpointName, endpointDetails] of Object.entries(this.endpointDetails)) {
        const ioExamples = []

        for (const endpoint of endpointDetails.supportedEndpoints) {
          for (const ioPair of endpointIO[endpoint] ?? []) {
            const { input, output } = ioPair
            const inputJson = JSON.stringify(input, null, 2)
            let outputJson = JSON.stringify(output, null, 2)
            const outputLines = outputJson.split('\n')
            if (outputLines.length > TRUNCATE_LINES)
              outputJson = outputLines.slice(0, TRUNCATE_LINES).join('\n') + '\n...'
            ioExamples.push(`Request:\n${wrapJson(inputJson)}\nResponse:\n${wrapJson(outputJson)}`)
          }
        }

        let ioExamplesText = exampleTextHeader
        if (ioExamples.length === 0) ioExamplesText += noExampleText
        else ioExamplesText += ioExamples[0]

        if (ioExamples.length > 1)
          ioExamplesText += `\n<details>\n<summary>Additional Examples</summary>\n\n${ioExamples
            .slice(1)
            .join('\n')}\n</details>`

        endpointExampleText[endpointName] = ioExamplesText
      }
    }

    // Build endpoint section text
    const endpointSections = Object.entries(this.endpointDetails)
      .map(([endpointName, endpointDetails]) => {
        if (this.verbose)
          console.log(`${this.adapterPath}: Adding ${endpointName} endpoint section`)

        const sectionTitle = `## ${capitalize(endpointName)} Endpoint`

        const endpointNames = codeList(endpointDetails.supportedEndpoints)

        let sectionDescription = endpointDetails.description
          ? endpointDetails.description + '\n\n'
          : ''

        sectionDescription +=
          endpointDetails.supportedEndpoints.length > 1
            ? `Supported names for this endpoint are: ${endpointNames}.`
            : endpointDetails.supportedEndpoints.length === 1
            ? `${endpointNames} is the only supported name for this endpoint.`
            : 'There are no supported names for this endpoint.'

        // Build input parameters table
        let inputTable = ''
        if (endpointDetails.inputParameters === balance.inputParameters) {
          inputTable = getBalanceTable()
        } else {
          const inputTableText: TableText = Object.entries(endpointDetails.inputParameters).map(
            ([param, attributes]) => {
              const name = param ?? ''

              let requiredIcon = ''
              let aliases = ''
              let description = ''
              let type = ''
              let options = ''
              let defaultText = ''
              let dependsOn = ''
              let exclusive = ''

              if (typeof attributes === 'boolean') {
                requiredIcon = attributes ? '✅' : ''
              } else if (Array.isArray(attributes)) {
                requiredIcon = '✅'
                aliases = codeList(attributes)
              } else {
                // InputParameter config
                requiredIcon = attributes.required ? '✅' : ''
                aliases = codeList(attributes.aliases)
                description = attributes.description ?? ''
                type = attributes.type ?? ''
                options = codeList(attributes.options)
                defaultText = attributes.default ? wrapCode(attributes.default) : ''
                dependsOn = codeList(attributes.dependsOn)
                exclusive = codeList(attributes.exclusive)
              }
              return [
                requiredIcon,
                name,
                aliases,
                description,
                type,
                options,
                defaultText,
                dependsOn,
                exclusive,
              ]
            },
          )

          inputTable = inputTableText.length
            ? buildTable(inputTableText, inputParamHeaders)
            : 'There are no input parameters for this endpoint.'
        }

        const inputTableSection = '### Input Params\n' + inputTable

        const exampleText = endpointExampleText[endpointName]

        return [sectionTitle, sectionDescription, inputTableSection, exampleText].join('\n\n')
      })
      .join('\n\n---\n\n')

    this.readmeText += endpointSections + '\n\n---\n'
  }

  createReadmeFile(): void {
    const readmePath = this.adapterPath + 'README.md'

    const shellString = new shell.ShellString(this.readmeText)
    shellString.to(readmePath)

    console.log(`${this.adapterPath}: README has been saved`)
  }
}
