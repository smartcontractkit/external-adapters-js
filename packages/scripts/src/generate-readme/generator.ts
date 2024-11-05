import { balance } from '@chainlink/ea-factories'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { SettingsDefinitionMap } from '@chainlink/external-adapter-framework/config'
import { InputParameters as V3InputParameters } from '@chainlink/external-adapter-framework/validation'
import { InputParametersDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import fs from 'fs'
import path from 'path'
import process from 'process'
import * as generatorPack from '../../package.json'
import { exec, test } from 'shelljs'
import {
  EndpointDetails,
  EnvVars,
  IOMap,
  JsonObject,
  Package,
  Schema,
  RateLimits,
  RateLimitsSchema,
} from '../shared/docGenTypes'
import {
  capitalize,
  codeList,
  getJsonFile,
  getMdFile,
  saveText,
  wrapCode,
  wrapJson,
} from '../shared/docGenUtils'
import { TableText, buildTable } from '../shared/tableUtils'
import { WorkspaceAdapter } from '../workspace'
import { getBalanceTable, inputParamHeaders, paramHeaders, rateLimitHeaders } from './tableAssets'

const testEnvOverrides = {
  API_VERBOSE: 'true',
  EA_PORT: '0',
  LOG_LEVEL: 'debug',
  METRICS_ENABLED: 'false',
  NODE_ENV: undefined,
  RECORD: undefined,
  WS_ENABLED: undefined,
}

const TRUNCATE_EXAMPLE_LINES = 500

const genSig =
  'This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.'

const exampleTextHeader = '### Example\n\n'

const noExampleText = 'There are no examples for this endpoint.'

const checkFilePaths = (filePaths: string[]): string => {
  for (const filePath of filePaths) {
    if (test('-f', filePath)) return filePath
  }
  throw Error(`No file found in the following paths: ${filePaths.join(',')}`)
}

export class ReadmeGenerator {
  schemaDescription: string
  adapterPath: string
  adapterType: string
  schemaPath: string
  packageJson: Package
  defaultEndpoint = ''
  defaultBaseUrl = ''
  endpointDetails: EndpointDetails = {}
  envVars: EnvVars
  rateLimitsPath: string
  rateLimits: RateLimits
  integrationTestPath: string | null
  name: string
  readmeText = ''
  requiredEnvVars: string[]
  verbose: boolean
  version: string
  versionBadgeUrl: string
  license: string
  frameworkVersion: 'v2' | 'v3'
  frameworkVersionBadgeUrl: string
  knownIssuesPath: string
  knownIssuesSection: string | null

  constructor(adapter: WorkspaceAdapter, verbose = false) {
    this.verbose = verbose
    this.adapterPath = adapter.location

    if (!this.adapterPath.endsWith('/')) this.adapterPath += '/'
    if (!test('-d', this.adapterPath)) throw Error(`${this.adapterPath} is not a directory`)
    if (verbose) console.log(`${this.adapterPath}: Checking package.json`)
    const packagePath = checkFilePaths([this.adapterPath + 'package.json'])
    const packageJson = getJsonFile(packagePath) as Package

    if (packageJson.dependencies) {
      const adapterEA = packageJson.dependencies['@chainlink/external-adapter-framework']
      if (adapterEA) {
        this.frameworkVersion = 'v3'
        const generatorEA = generatorPack.dependencies['@chainlink/external-adapter-framework']
        if (adapterEA != generatorEA) {
          console.log(`This generator uses ${generatorEA} but ${adapter.name} uses ${adapterEA}`)
        }
      } else {
        this.frameworkVersion = 'v2'
      }
    }

    this.version = packageJson.version ?? ''
    this.versionBadgeUrl = `https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=${packagePath}`
    this.frameworkVersionBadgeUrl = `https://img.shields.io/badge/framework%20version-${this.frameworkVersion}-blueviolet`
    this.license = packageJson.license ?? ''

    this.knownIssuesPath = this.adapterPath + 'docs/known-issues.md'
    this.schemaPath = this.adapterPath + 'schemas/env.json'
    this.rateLimitsPath = this.adapterPath + 'src/config/limits.json'
    this.integrationTestPath = this.adapterPath + 'test/integration/*.test.ts'
    this.packageJson = packageJson
  }

  // We need to require/import adapter contents to generate the README.
  // We use this function instead of the constructor because we need to fetch, and constructors can't be async.
  async loadAdapterContent(): Promise<void> {
    if (fs.existsSync(this.schemaPath)) {
      const configPath = checkFilePaths([
        this.adapterPath + 'src/config.ts',
        this.adapterPath + 'src/config/index.ts',
      ])
      const configFile = await require(path.join(process.cwd(), configPath))

      //Is V2. Populate self w/ env.json content
      if (this.verbose) console.log(`${this.adapterPath}: Checking schema/env.json`)
      const schema = getJsonFile(this.schemaPath) as Schema
      let rateLimits
      try {
        rateLimits = getJsonFile(this.rateLimitsPath)
      } catch (e) {
        rateLimits = { http: {} }
      }
      this.frameworkVersion = 'v2'
      this.schemaDescription = schema.description ?? ''
      this.name = schema.title ?? this.packageJson.name ?? ''
      this.envVars = schema.properties ?? {}
      this.rateLimits = (rateLimits as RateLimitsSchema)?.http || {}
      this.requiredEnvVars = schema.required ?? []
      this.defaultEndpoint = configFile.DEFAULT_ENDPOINT
      this.defaultBaseUrl = configFile.DEFAULT_BASE_URL || configFile.DEFAULT_WS_API_ENDPOINT

      if (this.verbose) console.log(`${this.adapterPath}: Importing src/endpoint/index.ts`)
      const endpointPath = checkFilePaths([this.adapterPath + 'src/endpoint/index.ts'])
      this.endpointDetails = await require(path.join(process.cwd(), endpointPath))
    } else {
      this.frameworkVersion = 'v3'
      if (this.verbose)
        console.log(`${this.adapterPath}: Importing framework adapter to read properties`)

      //Framework adapters don't use env.json. Instead, populate "schema" with import
      const adapterImport = await import(
        path.join(process.cwd(), this.adapterPath, 'dist', 'index.js')
      )

      const adapter = adapterImport.adapter as Adapter
      const adapterSettings = (
        adapter.config as unknown as { settingsDefinition: SettingsDefinitionMap }
      ).settingsDefinition
      this.name = adapter.name
      this.envVars = adapterSettings || {}
      this.rateLimits = adapter.rateLimiting?.tiers || {}

      this.endpointDetails = adapter.endpoints?.length
        ? adapter.endpoints.reduce(
            (accumulator, endpoint) =>
              Object.assign(accumulator, {
                [endpoint.name]: {
                  ...endpoint,
                  supportedEndpoints: [endpoint.name, ...(endpoint.aliases || [])],
                },
              }),
            {},
          )
        : {}

      this.requiredEnvVars = adapterSettings
        ? Object.keys(adapterSettings).filter((k) => adapterSettings[k].required === true) ?? [] // Keys of required customSettings
        : []
      //Note, not populating description, doesn't exist in framework adapters
      this.defaultEndpoint = adapter.defaultEndpoint ?? ''
    }

    if (fs.existsSync(this.knownIssuesPath)) {
      this.knownIssuesSection = getMdFile(this.knownIssuesPath) || null
    }
  }

  buildReadme(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Generating README text`)

    try {
      this.addIntroSection()
      this.addKnownIssuesSection()
      this.addEnvVarSection()
      this.addRateLimitSection()
      this.addInputParamsSection()
      this.addEndpointSections()
      this.addLicense()
      console.log(`${this.adapterPath}: README has been generated (unsaved)`)
    } catch (err) {
      console.error(`${this.adapterPath}: Error generating README: ${err}`)
      throw err
    }
  }

  addIntroSection(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Adding title and version`)
    this.readmeText = `# ${this.name}\n\n![${this.version}](${this.versionBadgeUrl}) ![${this.frameworkVersion}](${this.frameworkVersionBadgeUrl})\n\n`
    if (this.schemaDescription) this.readmeText += `${this.schemaDescription}\n\n`
    if (this.defaultBaseUrl) {
      this.readmeText += `Base URL ${this.defaultBaseUrl}\n\n`
    }
    this.readmeText += `${genSig}\n\n`
  }

  addKnownIssuesSection(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Adding known issues`)
    if (this.knownIssuesSection) this.readmeText += `${this.knownIssuesSection}\n\n`
  }

  addEnvVarSection(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Adding environment variables`)

    const envVars = this.envVars

    const tableText: TableText = Object.entries(envVars).map(([key, envVar]) => {
      const required = this.requiredEnvVars.includes(key) ? '✅' : ''
      const name = key ?? ''
      const description = envVar.description ?? ''
      const type = envVar.type ?? ''
      const options = codeList(envVar.options as Array<string | number>)
      const defaultText = Object.keys(envVar).includes('default') ? wrapCode(envVar.default) : ''
      return [required, name, description, type, options, defaultText]
    })

    const envVarTable = tableText.length
      ? buildTable(tableText, paramHeaders)
      : 'There are no environment variables for this adapter.'

    this.readmeText += `## Environment Variables\n\n${envVarTable}\n\n---\n\n`
  }

  addRateLimitSection(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Adding rate limits`)

    const rateLimits = this.rateLimits

    const tableText: TableText = Object.entries(rateLimits).map(([key, rateLimit]) => {
      const name = key ?? ''
      const rateLimit1s = rateLimit.rateLimit1s?.toString() || ''
      const rateLimit1m = rateLimit.rateLimit1m?.toString() || ''
      const rateLimit1h = rateLimit.rateLimit1h?.toString() || ''
      const notes = rateLimit.note || ''
      return [name, rateLimit1s, rateLimit1m, rateLimit1h, notes]
    })

    const rateLimitsTable = tableText.length
      ? buildTable(tableText, rateLimitHeaders)
      : 'There are no rate limits for this adapter.'

    this.readmeText += `## Data Provider Rate Limits\n\n${rateLimitsTable}\n\n---\n\n`
  }

  addInputParamsSection(): void {
    if (this.verbose) console.log(`${this.adapterPath}: Adding input parameters`)

    const endpointList = Object.keys(this.endpointDetails).reduce((list: string[], e) => {
      // supportedEndpoints is not a v3 field, but is populated by a conversion function in fetchImports for v3 adapters
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

    if (this.frameworkVersion === 'v3') {
      this.readmeText += `## Input Parameters\n\n${inputParamTable}\n\n`
    } else {
      this.readmeText += `## Input Parameters\n\nEvery EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)\n\n${inputParamTable}\n\n`
    }
  }

  buildV3InputParamsTable(definition: InputParametersDefinition, path: string[] = []): TableText {
    const text: TableText = []

    for (const [param, attributes] of Object.entries(definition)) {
      // In order
      const requiredIcon = attributes.required ? '✅' : ''
      const name = [...path, param].join('.')
      const aliases = attributes.aliases ? codeList(attributes.aliases as string[]) : ''
      const description = attributes.description
      const type =
        (typeof attributes.type === 'object' ? 'object' : attributes.type) +
        (attributes.array ? '[]' : '')
      const options = attributes.options ? codeList(attributes.options as string[]) : ''
      const defaultText = attributes.default ? wrapCode(attributes.default) : ''
      const dependsOn = attributes.dependsOn ? codeList(attributes.dependsOn as string[]) : ''
      const exclusive = attributes.exclusive ? codeList(attributes.exclusive as string[]) : ''

      text.push([
        requiredIcon,
        name,
        aliases,
        description,
        type,
        options,
        defaultText,
        dependsOn,
        exclusive,
      ])

      // If the type is a nested definition, add all those params with the current path as a prefix
      if (typeof attributes.type === 'object') {
        text.push(...this.buildV3InputParamsTable(attributes.type, [...path, param]))
      }
    }

    return text
  }

  addEndpointSections(): void {
    // Store I/O Examples for each endpoint
    const endpointExampleText: { [endpoint: string]: string } = {}
    // V3 uses examples provided in input parameters
    if (this.frameworkVersion === 'v3') {
      if (this.verbose) {
        console.log(`${this.adapterPath}: Pulling examples from input parameters`)
      }

      for (const endpointName of Object.keys(this.endpointDetails)) {
        const examplesText: string[] = []

        // If EA has no input params, use only `endpoint` as request example
        if (!Object.keys(this.endpointDetails[endpointName]?.inputParameters.definition).length) {
          const exText = JSON.stringify({ data: { endpoint: endpointName } }, null, 2)
          examplesText.push(`Request:\n\n${wrapJson(exText)}`)
        } else {
          const inputExamples = (this.endpointDetails[endpointName]?.inputParameters?.examples ||
            []) as Record<string, unknown>[]

          for (const example of inputExamples) {
            const exText = JSON.stringify({ data: { endpoint: endpointName, ...example } }, null, 2)
            examplesText.push(`Request:\n\n${wrapJson(exText)}`)
          }
        }

        let endpointExamples = exampleTextHeader
        if (examplesText.length === 0) {
          endpointExamples += noExampleText
        } else {
          endpointExamples += examplesText[0]
        }

        if (examplesText.length > 1)
          endpointExamples += `\n<details>\n<summary>Additional Examples</summary>\n\n${examplesText
            .slice(1)
            .join('\n')}\n</details>`

        endpointExampleText[endpointName] = endpointExamples
      }
    } else {
      // If not skipping tests, run through yarn test with testEnvOverrides variables
      if (this.verbose)
        console.log(`${this.adapterPath}: Running integration tests to get updated I/O examples`)

      const testOutput = exec(`yarn test ${this.integrationTestPath}`, {
        fatal: true,
        silent: true,
        env: { ...process.env, ...testEnvOverrides },
      }).toString()

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
          } catch (e: any) {
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
        const ioExamples: string[] = []

        for (const endpoint of endpointDetails.supportedEndpoints) {
          for (const ioPair of endpointIO[endpoint] ?? []) {
            const { input, output } = ioPair
            const inputJson = JSON.stringify(input, null, 2)
            let outputJson = JSON.stringify(output, null, 2)
            const outputLines = outputJson.split('\n')
            if (outputLines.length > TRUNCATE_EXAMPLE_LINES)
              outputJson = outputLines.slice(0, TRUNCATE_EXAMPLE_LINES).join('\n') + '\n...'
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
          let inputTableText: TableText
          if (endpointDetails.inputParameters instanceof V3InputParameters) {
            inputTableText = this.buildV3InputParamsTable(
              endpointDetails.inputParameters.definition,
            )
          } else {
            inputTableText = Object.entries(endpointDetails.inputParameters).map(
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
                  options = codeList(attributes.options as Array<string | number>)
                  defaultText = attributes.default
                    ? wrapCode(attributes.default as string | number | boolean)
                    : ''
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
          }

          inputTable = inputTableText.length
            ? buildTable(inputTableText, inputParamHeaders)
            : 'There are no input parameters for this endpoint.'
        }

        const inputTableSection = '### Input Params\n\n' + inputTable

        const exampleText = endpointExampleText[endpointName]

        return [sectionTitle, sectionDescription, inputTableSection, exampleText].join('\n\n')
      })
      .join('\n\n---\n\n')

    this.readmeText += endpointSections + '\n\n---\n\n'
  }

  addLicense(): void {
    if (this.license) {
      this.readmeText += `${this.license} License\n`
    }
  }

  createReadmeFile(): void {
    const path = this.adapterPath + 'README.md'
    saveText({ path, text: this.readmeText })
  }
}
