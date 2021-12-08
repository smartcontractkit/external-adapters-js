import * as shell from 'shelljs'
import { buildTable } from './table'
import commandLineArgs from 'command-line-args'
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
  TextRow,
} from './types'

const localPathToRoot = '../../../../'

const pathToBlacklist = 'packages/scripts/src/generate-readme/readme-blacklist.json'

const pathToSources = 'packages/sources/'

const paramHeaders: TextRow = ['Required?', 'Name', 'Description', 'Type', 'Options', 'Default']

const inputParamHeaders: TextRow = [
  'Required?',
  'Name',
  'Aliases',
  'Description',
  'Type',
  'Options',
  'Default',
  'Depends On',
  'Not Valid With',
]

const testEnvOverrides = { RECORD: undefined, LOG_LEVEL: 'debug', API_VERBOSE: 'true' }

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

const createReadmeFile = (adapterPath: string, readmeText: string): void => {
  const readmePath = adapterPath + 'README.md'

  const shellString = new shell.ShellString(readmeText)
  shellString.to(readmePath)

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
  version: string

  constructor(adapterPath: string) {
    if (!adapterPath.endsWith('/')) adapterPath += '/'

    if (!shell.test('-d', adapterPath)) throw Error(`${adapterPath} is not a directory`)

    const packagePath = checkFilePath(adapterPath + 'package.json')
    const schemaPath = checkFilePath(adapterPath + 'schemas/env.json')
    this.integrationTestPath = checkOptionalFilePath(
      adapterPath + 'test/integration/adapter.test.ts',
    )

    this.adapterPath = adapterPath

    const packageJson = getJsonFile(packagePath) as Package
    this.name = packageJson.name ?? ''
    this.version = packageJson.version ?? ''

    const schema = getJsonFile(schemaPath) as Schema
    this.schemaDescription = schema.description ?? ''
    this.envVars = schema.properties ?? {}
    this.requiredEnvVars = schema.required ?? []
  }

  async fetchImports(): Promise<void> {
    // Fetch imports as separate step, since dynamic imports are async but constructor can't contain async code

    const configPath = checkFilePath(this.adapterPath + 'src/config.ts')
    this.defaultEndpoint = (await require(localPathToRoot + configPath)).DEFAULT_ENDPOINT ?? ''

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
    console.log('Adding title and version...')

    this.readmeText = `# ${this.name}\n\nVersion: ${this.version}\n\n`
    if (this.schemaDescription) this.readmeText += `${this.schemaDescription}\n\n`
  }

  addEnvVarSection(): void {
    console.log('Adding environment variables...')

    const envVars = this.envVars

    const tableText: TableText = Object.entries(envVars).map(([key, envVar]) => {
      const required = this.requiredEnvVars.includes(key) ? '✅' : ''
      const name = key ?? ''
      const description = envVar.description ?? ''
      const type = envVar.type ?? ''
      const options = codeList(envVar.enum ?? [])
      const defaultText = envVar.default ? wrapCode(envVar.default) : ''
      return [required, name, description, type, options, defaultText]
    })

    const envVarTable = tableText.length
      ? buildTable(tableText, paramHeaders)
      : 'There are no environment variables for this adapter.'

    this.readmeText += `## Environment Variables\n\n${envVarTable}\n\n---\n\n`
  }

  addInputParamsSection(): void {
    console.log('Adding input parameters...')

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
    console.log('Extracting example requests and responses...')

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
        console.log(`Adding ${endpointName} endpoint section...`)

        const sectionTitle = `## ${capitalize(endpointName)} Endpoint`

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

        const inputTable = inputTableText.length
          ? buildTable(inputTableText, inputParamHeaders)
          : 'There are no input parameters for this endpoint.'

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
    const oldEnv: NodeJS.ProcessEnv = JSON.parse(JSON.stringify(process.env))
    process.env.NODE_ENV = undefined
    process.env.API_VERBOSE = undefined
    process.env.LOG_LEVEL = undefined

    const options = commandLineArgs([
      { name: 'all', alias: 'a', type: Boolean },
      { name: 'testPath', alias: 't', type: String },
      { name: 'adapters', multiple: true, defaultOption: true },
    ])

    if (options.testPath) {
      const readmeGenerator = new ReadmeGenerator(options.testPath)
      await readmeGenerator.fetchImports()

      createReadmeFile(readmeGenerator.getAdapterPath(), readmeGenerator.getReadme())
      return
    }

    let adapters: string[] = []

    if (options.all) adapters = shell.ls('-A', pathToSources).filter((name) => name !== 'README.md')
    else if (options.adapters?.length) adapters = options.adapters
    else throw Error('Please specify at least one adapter to generate the README for.')

    const blacklist = (getJsonFile(pathToBlacklist) as Blacklist).blacklist
    const adapterInBlacklist = blacklist.reduce((map: BooleanMap, a) => {
      map[a] = true
      return map
    }, {})

    const generatorTargets: string[] = adapters.filter((a) => !adapterInBlacklist[a])

    console.log('Collecting README updates')
    const readmeQueue = await Promise.all(
      generatorTargets.map(async (target) => {
        const readmeGenerator = new ReadmeGenerator(pathToSources + target)
        await readmeGenerator.fetchImports()

        const adapterPath = readmeGenerator.getAdapterPath()
        const readmeText = readmeGenerator.getReadme()
        return [adapterPath, readmeText]
      }),
    )

    console.log('Saving READMEs')
    for (const adapter of readmeQueue) {
      createReadmeFile(adapter[0], adapter[1])
    }

    process.env = oldEnv
  } catch (e) {
    console.log(`Error: ${e}`)
    process.exit(1)
  }
}
