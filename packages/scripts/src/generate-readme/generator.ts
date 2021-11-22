import * as shell from 'shelljs'
import { buildTable } from './table'
import commandLineArgs from 'command-line-args'
import {
  Blacklist,
  EndpointDetails,
  EndpointParameters,
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

const testEnvOverrides = { RECORD: undefined, LOG_LEVEL: 'debug', API_VERBOSE: 'true' }

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

const getJsonFile = (path: string): JsonObject => JSON.parse(shell.cat(path).toString())

const checkFilePath = (filePath: string): string => {
  if (!shell.test('-f', filePath)) throw Error(`${filePath} is not a file`)
  else return filePath
}

const checkOptionalFilePath = (filePath: string): string | null => {
  return shell.test('-f', filePath) ? filePath : null
}

const wrapJson = (objectStr: string): string => {
  return `\`\`\`json\n${objectStr}\n\`\`\``
}

class ReadmeGenerator {
  schemaDescription: string
  adapterPath: string
  defaultEndpoint = ''
  endpointDetails: EndpointDetails = {}
  schemaEndpointParameters: EndpointParameters
  envVars: EnvVars
  integrationTestPath: string | null
  name: string
  packagePath: string
  readmeText = ''
  requiredEnvVars: string[]
  schemaPath: string
  version: string

  constructor(adapterPath: string) {
    if (!adapterPath.endsWith('/')) adapterPath += '/'

    if (!shell.test('-d', adapterPath)) throw Error(`${adapterPath} is not a directory`)

    this.packagePath = checkFilePath(adapterPath + 'package.json')
    this.schemaPath = checkFilePath(adapterPath + 'schemas/env.json')
    this.integrationTestPath = checkOptionalFilePath(
      adapterPath + 'test/integration/adapter.test.ts',
    )

    this.adapterPath = adapterPath

    const packageJson = getJsonFile(this.packagePath) as Package
    this.name = packageJson.name
    this.version = packageJson.version

    const schema = getJsonFile(this.schemaPath) as Schema
    this.schemaDescription = schema.description
    this.schemaEndpointParameters = schema.endpointParameters
    this.envVars = schema.properties
    this.requiredEnvVars = schema.required
  }

  async fetchImports(): Promise<void> {
    // Fetch imports as separate step, since dynamic imports are async but constructor can't contain async code

    const configPath = checkFilePath(this.adapterPath + 'src/config.ts')
    this.defaultEndpoint = (await require(localPathToRoot + configPath)).DEFAULT_ENDPOINT ?? ''

    const endpointPath = checkFilePath(this.adapterPath + 'src/endpoint/index.ts')
    const codedEndpointDetails = await require(localPathToRoot + endpointPath)

    const endpointDetails = {}

    for (const schemaEndpoint in this.schemaEndpointParameters) {
      if (!(schemaEndpoint in codedEndpointDetails))
        throw Error(`Unknown endpoint ${schemaEndpoint} found in env.json schema.`)

      for (const inputParam in this.schemaEndpointParameters[schemaEndpoint]) {
        if (!(inputParam in codedEndpointDetails[schemaEndpoint].inputParameters))
          throw Error(
            `Unknown input param ${inputParam} for endpoint ${schemaEndpoint} found in env.json schema.`,
          )
      }
    }

    for (const codedEndpoint in codedEndpointDetails) {
      if (!(codedEndpoint in this.schemaEndpointParameters))
        throw Error(`Endpoint ${codedEndpoint} not found in env.json schema.`)

      const inputParameters = {}

      for (const codedInputParam in codedEndpointDetails[codedEndpoint].inputParameters) {
        if (!(codedInputParam in this.schemaEndpointParameters[codedEndpoint]))
          throw Error(
            `Input param ${codedInputParam} for endpoint ${codedEndpoint} not found in env.json schema.`,
          )

        inputParameters[codedInputParam] = {
          ...this.schemaEndpointParameters[codedEndpoint][codedInputParam],
          codedDetails: codedEndpointDetails[codedEndpoint].inputParameters[codedInputParam],
        }
      }

      endpointDetails[codedEndpoint] = {
        supportedEndpoints: codedEndpointDetails[codedEndpoint].supportedEndpoints,
        inputParameters,
      }
    }

    this.endpointDetails = endpointDetails
  }

  buildReadme(): void {
    console.log(`Generating README for ${this.adapterPath}`)

    this.addIntroSection()
    this.addEnvVarSection()
    this.addInputParamsSection()
    this.addEndpointSections()
    this.createReadmeFile()
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
      const options = envVar.enum?.map((e) => `\`${e.toString()}\``).join(', ') ?? ''
      const defaultText = envVar.default ? `\`${envVar.default.toString()}\`` : ''
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
        `\`${this.defaultEndpoint}\``,
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
        const sectionTitle = `## ${capitalize(endpointName)} Endpoint`

        // Fetch input table
        const inputTableText: TableText = Object.entries(endpointDetails.inputParameters).map(
          ([param, attributes]) => {
            const description =
              (attributes.description ?? '') +
              (Array.isArray(attributes.codedDetails) && attributes.codedDetails.length
                ? ` Available param names are: ${attributes.codedDetails
                    .map((d) => `\`${d}\``)
                    .join(', ')}.`
                : '')
            const required =
              Array.isArray(attributes.codedDetails) || attributes.codedDetails === true ? '✅' : ''
            const name = param ?? ''
            const type = attributes.type ?? ''
            const options = attributes.enum?.map((d) => `\`${d.toString()}\``).join(', ') ?? ''
            const defaultText = attributes.default ? `\`${attributes.default.toString()}\`` : ''
            return [required, name, description, type, options, defaultText]
          },
        )

        const inputTable = inputTableText.length
          ? buildTable(inputTableText, paramHeaders)
          : 'There are no input parameters for this endpoint.'

        const inputTableSection = '### Input Params\n' + inputTable

        // Fetch supported endpoint text
        const endpointNames = endpointDetails.supportedEndpoints.map((e) => `\`${e}\``)
        const supportedEndpointText =
          endpointNames.length > 1
            ? `Supported names for this endpoint are: ${endpointNames.join(', ')}.`
            : endpointNames.length === 1
            ? `${endpointNames[0]} is the only supported name for this endpoint.`
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

  createReadmeFile(): void {
    console.log('Creating README file...')

    const readmePath = this.adapterPath + 'README.md'
    if (shell.test('-f', readmePath)) {
      const archivePath = this.adapterPath + 'readme-archive/'
      if (!shell.test('-d', archivePath)) shell.mkdir(archivePath)

      let i = 0
      let archiveReadmePath = ''
      do {
        i += 1
        archiveReadmePath = `${archivePath}README-${i}.md`
      } while (shell.test('-f', archiveReadmePath))

      shell.cp(readmePath, archiveReadmePath)
    }

    const shellString = new shell.ShellString(this.readmeText)
    shellString.to(readmePath)

    console.log(`README saved at: ${readmePath}`)
  }
}

export async function main(): Promise<void> {
  try {
    const options = commandLineArgs([
      { name: 'all', alias: 'a', type: Boolean },
      { name: 'testPath', alias: 't', type: String },
      { name: 'adapters', multiple: true, defaultOption: true },
    ])

    if (options.testPath) {
      const readmeGenerator = new ReadmeGenerator(options.testPath)
      await readmeGenerator.fetchImports()
      readmeGenerator.buildReadme()
      return
    }

    let adapters = []

    if (options.all) adapters = shell.ls('-A', pathToSources).filter((name) => name !== 'README.md')
    else if (options.adapters?.length) adapters = options.adapters
    else throw Error('Please specify at least one adapter to generate the README for.')

    const blacklist = (getJsonFile(pathToBlacklist) as Blacklist).blacklist
    const adapterInBlacklist = blacklist.reduce((map, a) => {
      map[a] = true
      return map
    }, {})

    const generatorTargets: string[] = adapters.filter((a) => !adapterInBlacklist[a])

    for (const target of generatorTargets) {
      const readmeGenerator = new ReadmeGenerator(pathToSources + target)
      await readmeGenerator.fetchImports()
      readmeGenerator.buildReadme()
    }
  } catch (e) {
    console.log(`Error: ${e}`)
    return
  }
}
