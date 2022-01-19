import * as shell from 'shelljs'
import { buildTable } from './table'
import { balance } from '@chainlink/ea-factories'
import commandLineArgs from 'command-line-args'
import { getBalanceTable, inputParamHeaders, paramHeaders } from './tableAssets'
import {
  Blacklist,
  BooleanMap,
  EndpointDetails,
  EnvVars,
  IOMap,
  JsonObject,
  Package,
  Schema,
  TableText,
} from './types'

const localPathToRoot = '../../../../'

const pathToBlacklist = 'packages/scripts/src/generate-readme/readme-blacklist.json'

const pathToSources = 'packages/sources/'

const testEnvOverrides = {
  API_VERBOSE: 'true',
  LOG_LEVEL: 'debug',
  NODE_ENV: undefined,
  RECORD: undefined,
}

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

const wrapJson = (o: string): string => `\`\`\`json\n${o}\n\`\`\``

const wrapCode = (s: string | number = ''): string => `\`${s.toString()}\``

const codeList = (a: (string | number)[] = []): string => a.map((d) => wrapCode(d)).join(', ')

const getJsonFile = (path: string): JsonObject => JSON.parse(shell.cat(path).toString())

const checkFilePath = (filePath: string): string => {
  if (!shell.test('-f', filePath)) throw Error(`${filePath} is not a file`)
  else return filePath
}

const checkOptionalFilePath = (filePath: string): string | null => {
  return shell.test('-f', filePath) ? filePath : null
}

const createReadmeFile = (adapterPath: string, readmeText: string, stage?: boolean): void => {
  const readmePath = adapterPath + 'README.md'

  const shellString = new shell.ShellString(readmeText)
  shellString.to(readmePath)

  if (stage) shell.exec(`git add ${readmePath}`)

  console.log(`README saved at ${readmePath}`)
}

class ReadmeGenerator {
  schemaDescription: string
  adapterPath: string
  defaultEndpoint = ''
  endpointDetails: EndpointDetails = {}
  envVars: EnvVars
  integrationTestPath: string | null
  name: string
  readmeText = ''
  requiredEnvVars: string[]
  verbose: boolean
  version: string

  constructor(adapterPath: string, verbose = false) {
    this.verbose = verbose

    if (verbose) console.log('Confirming file paths')
    if (!adapterPath.endsWith('/')) adapterPath += '/'

    if (!shell.test('-d', adapterPath)) throw Error(`${adapterPath} is not a directory`)

    const packagePath = checkFilePath(adapterPath + 'package.json')
    const schemaPath = checkFilePath(adapterPath + 'schemas/env.json')
    this.integrationTestPath = checkOptionalFilePath(
      adapterPath + 'test/integration/adapter.test.ts',
    )

    this.adapterPath = adapterPath

    if (verbose) console.log('Checking package.json')
    const packageJson = getJsonFile(packagePath) as Package
    this.version = packageJson.version ?? ''

    if (verbose) console.log('Checking schema/env.json')
    const schema = getJsonFile(schemaPath) as Schema
    this.schemaDescription = schema.description ?? ''
    this.name = schema.title ?? packageJson.name ?? ''
    this.envVars = schema.properties ?? {}
    this.requiredEnvVars = schema.required ?? []
  }

  async fetchImports(): Promise<void> {
    // Fetch imports as separate step, since dynamic imports are async but constructor can't contain async code

    if (this.verbose) console.log('Importing src/config.ts')
    const configPath = checkFilePath(this.adapterPath + 'src/config.ts')
    this.defaultEndpoint = (await require(localPathToRoot + configPath)).DEFAULT_ENDPOINT ?? ''

    if (this.verbose) console.log('Importing src/endpoint/index.ts')
    const endpointPath = checkFilePath(this.adapterPath + 'src/endpoint/index.ts')
    this.endpointDetails = await require(localPathToRoot + endpointPath)
  }

  getAdapterPath(): string {
    return this.adapterPath
  }

  getReadme(): string {
    console.log(`Generating README text for ${this.adapterPath}`)

    this.addIntroSection()
    this.addEnvVarSection()
    this.addInputParamsSection()
    this.addEndpointSections()

    return this.readmeText
  }

  addIntroSection(): void {
    if (this.verbose) console.log('Adding title and version...')

    this.readmeText = `# ${this.name}\n\nVersion: ${this.version}\n\n`
    if (this.schemaDescription) this.readmeText += `${this.schemaDescription}\n\n`
  }

  addEnvVarSection(): void {
    if (this.verbose) console.log('Adding environment variables...')

    const envVars = this.envVars

    const tableText: TableText = Object.entries(envVars).map(([key, envVar]) => {
      const required = this.requiredEnvVars.includes(key) ? '✅' : ''
      const name = key ?? ''
      const description = envVar.description ?? ''
      const type = envVar.type ?? ''
      const options = codeList(envVar.options ?? [])
      const defaultText = Object.keys(envVar).includes('default') ? wrapCode(envVar.default) : ''
      return [required, name, description, type, options, defaultText]
    })

    const envVarTable = tableText.length
      ? buildTable(tableText, paramHeaders)
      : 'There are no environment variables for this adapter.'

    this.readmeText += `## Environment Variables\n\n${envVarTable}\n\n---\n\n`
  }

  addInputParamsSection(): void {
    if (this.verbose) console.log('Adding input parameters...')

    const endpointList = Object.keys(this.endpointDetails).map((e) => {
      const lowercase = e.toLowerCase()
      return `[${lowercase}](#${lowercase}-endpoint)`
    })
    const tableText = [
      [
        '',
        'endpoint',
        'The endpoint to use',
        'string',
        endpointList.join(', '),
        wrapCode(this.defaultEndpoint),
      ],
    ]

    const inputParamTable = tableText.length
      ? buildTable(tableText, paramHeaders)
      : 'There are no input parameters for this adapter.'

    this.readmeText += `## Input Parameters\n\n${inputParamTable}\n\n---\n\n`
  }

  addEndpointSections(): void {
    if (this.verbose) console.log('Extracting example requests and responses...')

    // Fetch input/output examples
    let endpointIO = {} as IOMap
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
        if (this.verbose) console.log(`Adding ${endpointName} endpoint section...`)

        const sectionTitle = `## ${capitalize(endpointName)} Endpoint`

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

        // Fetch supported endpoint text
        const endpointNames = codeList(endpointDetails.supportedEndpoints)
        const supportedEndpointText =
          endpointDetails.supportedEndpoints.length > 1
            ? `Supported names for this endpoint are: ${endpointNames}.`
            : endpointDetails.supportedEndpoints.length === 1
            ? `${endpointNames} is the only supported name for this endpoint.`
            : 'There are no supported names for this endpoint.'

        // Fetch input/output text
        const ioExamples = []
        for (const supportedName of endpointDetails.supportedEndpoints) {
          if (supportedName in endpointIO) {
            for (const ioPair of endpointIO[supportedName]) {
              const { input, output } = ioPair
              const inputJson = JSON.stringify(input, null, 2)
              const outputJson = JSON.stringify(output, null, 2)
              ioExamples.push(
                `Request:\n${wrapJson(inputJson)}\nResponse:\n${wrapJson(outputJson)}`,
              )
            }
          }
        }
        let ioExamplesText = ''
        if (ioExamples.length === 0) ioExamplesText = 'There are no examples for this endpoint.'
        else ioExamplesText = '### Example\n' + ioExamples[0]

        if (ioExamples.length > 1)
          ioExamplesText += `\n<details>\n<summary>Additional Examples</summary>\n\n${ioExamples
            .slice(1)
            .join('\n\n')}\n</details>\n`

        return [sectionTitle, supportedEndpointText, inputTableSection, ioExamplesText].join('\n\n')
      })
      .join('\n\n---\n\n')

    this.readmeText += endpointSections + '\n'
  }
}

export async function main(): Promise<void | string> {
  try {
    // define command line options
    const options = commandLineArgs([
      { name: 'all', alias: 'a', type: Boolean }, // Generate READMEs for all source EAs not in blacklist
      { name: 'files', alias: 'f', multiple: true }, // Generate READMEs for all file paths provided that originate in source EAs
      { name: 'verbose', alias: 'v', type: Boolean }, // Include extra logs for each generation process
      { name: 'stage', alias: 's', type: Boolean }, // Stage READMEs after generation
      { name: 'testPath', alias: 't', type: String }, // Run script as test for EA along given path
      { name: 'adapters', multiple: true, defaultOption: true }, // Generate READMEs for all source EAs given by name
    ])

    // test setting
    if (options.testPath) {
      const readmeGenerator = new ReadmeGenerator(options.testPath, options.verbose)
      await readmeGenerator.fetchImports()

      createReadmeFile(readmeGenerator.getAdapterPath(), readmeGenerator.getReadme())
      return
    }

    // fetch list of adapters
    let adapters: string[] = []

    if (options.all) {
      adapters = shell.ls('-A', pathToSources).filter((name) => name !== 'README.md')
    } else if (options.files?.length) {
      adapters = options.files.reduce((list: string[], file: string) => {
        const filePath = file.split('/')
        if (filePath[1] === 'sources' && !list.includes(filePath[2])) list.push(filePath[2])
        return list
      }, [])
    } else if (options.adapters?.length) {
      adapters = options.adapters
    }

    // filter list by blacklist
    const blacklist = (getJsonFile(pathToBlacklist) as Blacklist).blacklist
    const adapterInBlacklist = blacklist.reduce((map: BooleanMap, a) => {
      map[a] = true
      return map
    }, {})
    adapters = adapters.filter((a) => !adapterInBlacklist[a])

    // collect new README versions
    console.log('Collecting README updates')
    const readmeQueue = await Promise.all(
      adapters.map(async (target) => {
        const readmeGenerator = new ReadmeGenerator(pathToSources + target, options.verbose)
        await readmeGenerator.fetchImports()
        return [readmeGenerator.getAdapterPath(), readmeGenerator.getReadme()]
      }),
    )

    // save README files
    console.log('Saving READMEs')
    for (const adapter of readmeQueue) {
      createReadmeFile(adapter[0], adapter[1], options.stage)
    }
  } catch (e) {
    console.log(`Error: ${e}`)
    process.exit(1)
  }
}
