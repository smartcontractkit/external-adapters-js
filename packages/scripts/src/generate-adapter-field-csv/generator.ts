import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { SettingsDefinitionMap } from '@chainlink/external-adapter-framework/config'
import fs from 'fs'
import path from 'path'
import process from 'process'
import { test } from 'shelljs'
import * as generatorPack from '../../package.json'
import {
  EndpointDetails,
  EnvVars,
  Package,
  RateLimits,
  RateLimitsSchema,
  Schema,
} from '../shared/docGenTypes'
import { getJsonFile, getMdFile } from '../shared/docGenUtils'
import { WorkspaceAdapter } from '../workspace'

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

// Checks if an object appears to be an instance of the given class while
// allowing for the possibility that the class is from a different version
// of the package.
const objectHasShapeOfClass = (object, Class): boolean => {
  if (object instanceof Class) {
    return true
  }

  const objectProps = Object.getOwnPropertyNames(object.constructor.prototype)
  const classProps = Object.getOwnPropertyNames(Class.prototype)

  if (objectProps.length !== classProps.length) {
    return false
  }

  for (const prop of classProps) {
    if (!objectProps.includes(prop)) {
      return false
    }
  }
  return true
}

export class AdapterFieldGenerator {
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

  buildCSV(): string[] {
    if (this.verbose) console.log(`${this.adapterPath}: Generating csv`)

    const envVars = this.envVars

    if (this.frameworkVersion === 'v2') {
      return []
    }

    return Object.entries(envVars).map(([field, v]) => {
      const sensitive = v.sensitive ? 'true' : 'false'
      return [this.name, field, sensitive].map(String).join(',')
    })
  }
}
