import * as shell from 'shelljs'
import { buildTable } from './table'
import { balance } from '@chainlink/ea-factories'
import { Logger } from '@chainlink/ea-bootstrap'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { getBalanceTable, inputParamHeaders, paramHeaders } from './tableAssets'
import {
  Adapter,
  Blacklist,
  BooleanMap,
  EndpointDetails,
  EnvVars,
  IOMap,
  JsonObject,
  MappedAdapters,
  Package,
  Schema,
  TableText,
} from './types'

const localPathToRoot = '../../../../'

const pathToBlacklist = 'packages/scripts/src/generate-readme/readme-blacklist.json'

const pathToSources = 'packages/sources/'

const testEnvOverrides = {
  API_VERBOSE: undefined,
  EA_PORT: '0',
  LOG_LEVEL: 'debug',
  NODE_ENV: undefined,
  RECORD: undefined,
}

const genSig =
  'This README was generated automatically. Please see [scripts](../../scripts) for more info.'
const genSigGrep =
  'This README was generated automatically\\. Please see \\[scripts\\]\\(\\.\\.\\/\\.\\.\\/scripts\\) for more info\\.'

const exampleTextHeader = '### Example\n'

const noExampleText = 'There are no examples for this endpoint.'

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

const wrapJson = (o: string): string => `\`\`\`json\n${o}\n\`\`\``

const wrapCode = (s: string | number = ''): string => `\`${s.toString()}\``

const codeList = (a: (string | number)[] = []): string => a.map((d) => wrapCode(d)).join(', ')

const getJsonFile = (path: string): JsonObject => JSON.parse(shell.cat(path).toString())

const checkFilePath = (filePath: string): string => {
  if (!shell.test('-f', filePath)) throw Error(`${filePath} is not a file`)
  else return filePath
}

const createReadmeFile = (adapterPath: string, readmeText: string, stage?: boolean): void => {
  const readmePath = adapterPath + 'README.md'

  const shellString = new shell.ShellString(readmeText)
  shellString.to(readmePath)

  if (stage) shell.exec(`git add ${readmePath}`)
}

class ReadmeGenerator {
  schemaDescription: string
  adapterPath: string
  defaultEndpoint: string
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

    if (verbose) Logger.debug({ adapterPath, msg: 'Confirming file paths' })

    if (!shell.test('-d', adapterPath)) throw Error(`${adapterPath} is not a directory`)

    const packagePath = checkFilePath(adapterPath + 'package.json')
    const schemaPath = checkFilePath(adapterPath + 'schemas/env.json')

    this.skipTests = skipTests
    this.integrationTestPath = adapterPath + 'test/integration/*.test.ts'

    this.adapterPath = adapterPath

    if (verbose) Logger.debug({ adapterPath, msg: 'Checking package.json' })
    const packageJson = getJsonFile(packagePath) as Package
    this.version = packageJson.version ?? ''

    if (verbose) Logger.debug({ adapterPath, msg: 'Checking schema/env.json' })
    const schema = getJsonFile(schemaPath) as Schema
    this.schemaDescription = schema.description ?? ''
    this.name = schema.title ?? packageJson.name ?? ''
    this.envVars = schema.properties ?? {}
    this.requiredEnvVars = schema.required ?? []
  }

  async fetchImports(): Promise<void> {
    // Fetch imports as separate step, since dynamic imports are async but constructor can't contain async code

    if (this.verbose)
      Logger.debug({ adapterPath: this.adapterPath, msg: 'Importing src/config.ts' })
    const configPath = checkFilePath(this.adapterPath + 'src/config.ts')
    this.defaultEndpoint = (await require(localPathToRoot + configPath)).DEFAULT_ENDPOINT

    if (this.verbose)
      Logger.debug({ adapterPath: this.adapterPath, msg: 'Importing src/endpoint/index.ts' })
    const endpointPath = checkFilePath(this.adapterPath + 'src/endpoint/index.ts')
    this.endpointDetails = await require(localPathToRoot + endpointPath)
  }

  getAdapterPath(): string {
    return this.adapterPath
  }

  getReadme(): string {
    if (this.verbose) Logger.debug({ adapterPath: this.adapterPath, msg: 'Generating README text' })

    this.addIntroSection()
    this.addEnvVarSection()
    this.addInputParamsSection()
    this.addEndpointSections()

    Logger.info(`${this.adapterPath}: New README text has been prepared`)

    return this.readmeText
  }

  addIntroSection(): void {
    if (this.verbose)
      Logger.debug({ adapterPath: this.adapterPath, msg: 'Adding title and version' })

    this.readmeText = `# ${this.name}\n\nVersion: ${this.version}\n\n`
    if (this.schemaDescription) this.readmeText += `${this.schemaDescription}\n\n`
    this.readmeText += `${genSig}\n\n`
  }

  addEnvVarSection(): void {
    if (this.verbose)
      Logger.debug({ adapterPath: this.adapterPath, msg: 'Adding environment variables' })

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
    if (this.verbose)
      Logger.debug({ adapterPath: this.adapterPath, msg: 'Adding input parameters' })

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
        this.defaultEndpoint ? wrapCode(this.defaultEndpoint) : '',
      ],
    ]

    const inputParamTable = tableText.length
      ? buildTable(tableText, paramHeaders)
      : 'There are no input parameters for this adapter.'

    this.readmeText += `## Input Parameters\n\n${inputParamTable}\n\n---\n\n`
  }

  addEndpointSections() {
    // Store IO Examples for each endpoint
    const endpointExampleText: { [endpoint: string]: string } = {}
    if (this.skipTests) {
      if (this.verbose)
        Logger.debug({
          adapterPath: this.adapterPath,
          msg: 'Pulling I/O examples from existing README',
        })

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
      if (this.verbose)
        Logger.debug({
          adapterPath: this.adapterPath,
          msg: 'Running integration tests to get updated I/O examples',
        })

      const testOutput = shell
        .exec(`yarn test ${this.integrationTestPath}`, {
          fatal: true,
          silent: true,
          env: { ...process.env, ...testEnvOverrides },
        })
        .toString()

      if (this.verbose)
        Logger.debug({ adapterPath: this.adapterPath, msg: 'Processing example data' })

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

      const endpointIO = logObjects.reduce((ioMap: IOMap, inOutPair) => {
        if (inOutPair.length === 2) {
          const endpoint = inOutPair[0]?.data?.endpoint ?? this.defaultEndpoint
          ioMap[endpoint] = ioMap[endpoint] ?? []
          ioMap[endpoint].push({ input: inOutPair[0], output: inOutPair[1] })
        }
        return ioMap
      }, {})

      for (const [endpointName, endpointDetails] of Object.entries(this.endpointDetails)) {
        const ioExamples = []

        for (const endpoint of endpointDetails.supportedEndpoints) {
          for (const ioPair of endpointIO[endpoint] ?? []) {
            const { input, output } = ioPair
            const inputJson = JSON.stringify(input, null, 2)
            const outputJson = JSON.stringify(output, null, 2)
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

    const endpointSections = Object.entries(this.endpointDetails)
      .map(([endpointName, endpointDetails]) => {
        if (this.verbose)
          Logger.debug({
            adapterPath: this.adapterPath,
            msg: `Adding ${endpointName} endpoint section`,
          })

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

        const exampleText = endpointExampleText[endpointName]

        return [sectionTitle, supportedEndpointText, inputTableSection, exampleText].join('\n\n')
      })
      .join('\n\n---\n\n')

    this.readmeText += endpointSections + '\n\n---\n'
  }
}

export async function main(): Promise<void | string> {
  try {
    const commandLineOptions = [
      {
        name: 'all',
        alias: 'a',
        type: Boolean,
        description: 'Generate READMEs for all source EAs not in blacklist',
      },
      {
        name: 'verbose',
        alias: 'v',
        type: Boolean,
        description: 'Include extra logs for each generation process',
      },
      {
        name: 'stage',
        alias: 's',
        type: Boolean,
        description:
          'Generate READMEs for staged file paths and stage the changes (used for pre-commit hook)',
      },
      {
        name: 'testPath',
        alias: 't',
        type: String,
        description: 'Run script as test for EA along given path',
      },
      {
        name: 'adapters',
        multiple: true,
        defaultOption: true,
        description: 'Generate READMEs for all source EAs given by name',
      },
      { name: 'help', alias: 'h', type: Boolean, description: 'Display usage guide' },
    ]
    const options = commandLineArgs(commandLineOptions)

    // Generate usage guide
    if (options.help) {
      const usage = commandLineUsage([
        {
          header: 'README Generator Script',
          content:
            'This script is run from the root of the external-adapter-js/ repo to generate READMEs for supported external adapters. This functionality is currently limited to a subset of source adapters only.',
        },
        {
          header: 'Options',
          optionList: commandLineOptions,
        },
        {
          content:
            'Source code: {underline https://github.com/smartcontractkit/external-adapters-js/packages/scripts/src/generate-readme/ }',
        },
      ])
      console.log(usage)
      return
    }

    Logger.info({ msg: 'Generating READMEs' })

    // test setting
    if (options.testPath) {
      const readmeGenerator = new ReadmeGenerator(options.testPath, options.verbose)
      await readmeGenerator.fetchImports()

      createReadmeFile(readmeGenerator.getAdapterPath(), readmeGenerator.getReadme())
      return
    }

    // fetch list of adapters
    let adapters: Adapter[] = []

    if (options.all) {
      adapters = shell
        .ls('-A', pathToSources)
        .filter((name) => name !== 'README.md')
        .map((name) => ({ name }))
    } else if (options.stage) {
      const stagedFiles = shell.exec('git diff --name-only --cached').toString().split('\n')

      const mappedAdapters: MappedAdapters = stagedFiles.reduce(
        (map: MappedAdapters, file: string) => {
          const filePath = file.split('/')
          if (filePath[1] === 'sources') {
            const name = filePath[2]
            if (!map[name]) {
              const readmePath = filePath.slice(0, 3).join('/') + '/README.md'
              map[name] = {
                readmeIsGenerated: shell.cat(readmePath).toString()?.match(genSigGrep)?.length > 0,
              }
            }

            if (filePath.slice(3, 5).join('/') === 'test/integration') {
              map[name].testsUpdated = true
            } else if (filePath.slice(3, 6).join('/') === 'src/endpoint/index.ts') {
              map[name].endpointIndexUpdated = true
            }
          }
          return map
        },
        {},
      )

      adapters = Object.keys(mappedAdapters).map((name) => {
        const options = mappedAdapters[name]
        const skipTests =
          options.readmeIsGenerated && !options?.testsUpdated && !options?.endpointIndexUpdated
        return { name, skipTests }
      })
    } else if (options.adapters?.length) {
      adapters = options.adapters.map((name) => ({ name }))
    }

    // filter list by blacklist
    const blacklist = (getJsonFile(pathToBlacklist) as Blacklist).blacklist
    const adapterInBlacklist = blacklist.reduce((map: BooleanMap, a) => {
      map[a] = true
      return map
    }, {})
    adapters = adapters.filter((a) => !adapterInBlacklist[a.name])

    // collect new README versions
    const readmeQueue = await Promise.all(
      adapters.map(async (adapter: Adapter) => {
        const readmeGenerator = new ReadmeGenerator(
          pathToSources + adapter.name,
          options.verbose,
          adapter.skipTests,
        )
        await readmeGenerator.fetchImports()
        return [readmeGenerator.getAdapterPath(), readmeGenerator.getReadme()]
      }),
    )

    // save README files
    for (const adapter of readmeQueue) {
      createReadmeFile(adapter[0], adapter[1], options.stage)
    }
    Logger.info({ msg: `${readmeQueue.length} README(s) generated.` })
    process.exit(0)
  } catch (error) {
    Logger.error({ error: error.message, stack: error.stack })
    process.exit(1)
  }
}
