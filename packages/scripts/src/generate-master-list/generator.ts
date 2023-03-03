import process from 'process'
import path from 'path'
import { ls, test } from 'shelljs'
import {
  compositeListDescription,
  sourceListDescription,
  targetListDescription,
  nonDeployableListDescription,
} from './textAssets'
import { buildTable, TableText } from '../shared/tableUtils'
import {
  codeList,
  getJsonFile,
  saveText,
  sortText,
  unwrapCode,
  wrapCode,
} from '../shared/docGenUtils'
import { EndpointDetails, Package, Schema } from '../shared/docGenTypes'
import Airtable from 'airtable'
import fs from 'fs'

const pathToComposites = 'packages/composites/'
const pathToSources = 'packages/sources/'
const pathToNonDeployables = 'packages/non-deployable/'
const pathToTargets = 'packages/targets/'

const baseEaDependencies = [
  'ea',
  'ea-bootstrap',
  'ea-factories',
  'ea-reference-data-reader',
  'ea-test-helpers',
]

const getListText = (list: string[], description: string): string => {
  return description + '\n\n## List\n\n' + list.join('\n') + '\n'
}

const getRedirectText = (path: string, name: string) => `[${name}](${path}${name}/README.md)`

const getGroupRedirect = (name: string) => `- [${name}](./${name}/README.md)`

const getConfigDefaults = async (adapterPath: string, verbose = false) => {
  let defaultBaseUrl = 'Unknown'
  let defaultEndpoint = 'Unknown'
  try {
    const configPath = adapterPath + '/src/config/index.ts'
    const config = await require(path.join(process.cwd(), configPath))

    if (config.DEFAULT_BASE_URL) defaultBaseUrl = wrapCode(config.DEFAULT_BASE_URL)
    else if (config.DEFAULT_API_ENDPOINT) defaultBaseUrl = wrapCode(config.DEFAULT_API_ENDPOINT)
    if (config.DEFAULT_ENDPOINT) defaultEndpoint = wrapCode(config.DEFAULT_ENDPOINT)

    return { defaultBaseUrl, defaultEndpoint }
  } catch (e: any) {
    const error = e as Error
    if (verbose) console.error({ error: error.message, stack: error.stack })
    return { defaultBaseUrl, defaultEndpoint }
  }
}

const getEndpoints = async (adapterPath: string, verbose = false) => {
  let endpointsText = 'Unknown'
  let batchableEndpoints = 'Unknown'
  try {
    const indexPath = adapterPath + '/src/endpoint/index.ts'
    const schemaPath = adapterPath + '/src/schemas/env.json'

    const endpointDetails: EndpointDetails = await require(path.join(process.cwd(), indexPath))
    const schema = getJsonFile(schemaPath) as Schema
    const endpoints = Object.keys(endpointDetails)

    let allSupportedEndpoints: string[] = []
    let allBatchableEndpoints: string[] = []
    if (!fs.existsSync(schemaPath)) {
      console.log(
        `${schema.title} is a v3 adapter, converting it to v2 format for master list generation`,
      )
      Object.keys(endpointDetails).forEach((endpointName) => {
        const endpoint = endpointDetails[endpointName]
        allSupportedEndpoints.push(endpointName, ...(endpoint.aliases || []))
      })
    } else {
      //Is a v2 adapter
      allSupportedEndpoints = endpoints.reduce((list: string[], e) => {
        const supportedEndpoints = endpointDetails[e].supportedEndpoints ?? []
        list.push(...supportedEndpoints)
        return list
      }, [])

      allBatchableEndpoints = endpoints.filter((e) => endpointDetails[e].batchablePropertyPath)
    }

    endpointsText = allSupportedEndpoints.length ? codeList(allSupportedEndpoints) : ''

    batchableEndpoints = allBatchableEndpoints.length ? codeList(allBatchableEndpoints) : ''

    return { endpointsText, batchableEndpoints }
  } catch (e: any) {
    const error = e as Error
    if (verbose) console.error({ error: error.message, stack: error.stack })
    return { endpointsText, batchableEndpoints }
  }
}

const getEnvVars = (adapterPath: string, verbose = false) => {
  try {
    const schemaPath = adapterPath + '/schemas/env.json'

    const { properties = {}, required = [] } = getJsonFile(schemaPath) as Schema

    const envVarsList = Object.keys(properties)

    const withCheckbox = envVarsList.map((e) => e + (required.includes(e) ? ' (✅)' : ''))

    const formatted = codeList(withCheckbox)

    return formatted
  } catch (e: any) {
    const error = e as Error
    if (verbose) console.error({ error: error.message, stack: error.stack })
    return 'Unknown'
  }
}

const getPackage = (adapterPath: string, verbose = false) => {
  let dependencies = 'Unknown'
  let version = 'Unknown'
  let frameworkVersion = 'v2'
  try {
    const packagePath = adapterPath + '/package.json'
    const packageJson = getJsonFile(packagePath) as Package

    if (packageJson.version) version = wrapCode(packageJson.version)

    if (packageJson.dependencies) {
      frameworkVersion = packageJson.dependencies['@chainlink/external-adapter-framework']
        ? 'v3'
        : 'v2'

      let dependencyList = Object.keys(packageJson.dependencies)
      dependencyList = dependencyList.reduce((list: string[], dep) => {
        const depSplit = dep.split('/')
        if (depSplit[0] === '@chainlink' && !baseEaDependencies.includes(depSplit[1]))
          list.push(wrapCode(depSplit[1]))
        return list
      }, [])
      dependencies = dependencyList.length ? codeList(dependencyList) : ''
    }
    return { dependencies, version, frameworkVersion }
  } catch (e: any) {
    const error = e as Error
    if (verbose) console.error({ error: error.message, stack: error.stack })
    return { dependencies, version, frameworkVersion }
  }
}

const getTestSupport = (adapterPath: string) => {
  const pathToTests = adapterPath + '/test'
  const pathToE2E = pathToTests + '/e2e'
  const pathToIntegration = pathToTests + '/integration'
  const pathToUnit = pathToTests + '/unit'
  return {
    e2e: test('-d', pathToE2E) ? `[✅](${pathToE2E})` : '',
    integration: test('-d', pathToIntegration) ? `[✅](${pathToIntegration})` : '',
    unit: test('-d', pathToUnit) ? `[✅](${pathToUnit})` : '',
  }
}

const getWSSupport = async (adapterPath: string, verbose = false) => {
  try {
    const adapterFile = await require(path.join(process.cwd(), adapterPath, '/src/adapter.ts'))

    return adapterFile.makeWSHandler ? '✅' : ''
  } catch (e: any) {
    const error = e as Error
    if (verbose) console.error({ error: error.message, stack: error.stack })
    return 'Unknown'
  }
}

const getAdapterList = (pathToParent: string, listDescription: string) => {
  const adapters = ls('-A', pathToParent).filter((n) => n !== 'README.md')
  const redirectList = adapters.map(getGroupRedirect)
  const text = getListText(redirectList, listDescription)
  return { adapters, text }
}

const generateAirtableMasterList = async (adapterList: TableText) => {
  const airtableApiKey = process.env.AIRTABLE_API_KEY
  const airtableBaseID = process.env.AIRTABLE_BASE_ID

  const tableName = 'EA_MASTER_LIST'
  const viewName = 'EA MasterList'

  if (!airtableApiKey || !airtableBaseID) {
    throw 'Missing AIRTABLE_API_KEY and/or AIRTABLE_BASE_ID'
  }

  console.log('Generating Airtable master adapters list.')

  const base = new Airtable({ apiKey: airtableApiKey }).base(airtableBaseID)
  const airtableRecordIds: { [key: string]: Record<string, string> } = {}

  await base(tableName)
    .select({
      view: viewName,
    })
    .eachPage((records, fetchNextPage) => {
      records.forEach((record) => {
        const name: string = record.get('Name') as string
        airtableRecordIds[name] = {
          name: record.get('Name') as string,
          version: record.get('Version') as string,
          id: record.getId(),
        }
      })
      fetchNextPage()
    })

  const tasks = []
  for (const adapter of adapterList) {
    let name = adapter[0]
    name = name.substring(name.indexOf('[') + 1, name.lastIndexOf(']'))
    const record = airtableRecordIds[name]
    const version = unwrapCode(adapter[1])
    const type = unwrapCode(adapter[2])
    const frameworkVersion = unwrapCode(adapter[3])
    const defaultApiUrl = unwrapCode(adapter[4])
    const dependencies = unwrapCode(adapter[5])
    const envVars = unwrapCode(adapter[6])
    const endpoints = unwrapCode(adapter[7])
    const defEndpoint = unwrapCode(adapter[8])
    const batchableEndpoints = unwrapCode(adapter[9])
    const isWSSupported = unwrapCode(adapter[10]) === '✅'
    const hasUnitTests = unwrapCode(adapter[11]).includes('✅')
    const hasIntegrationTests = unwrapCode(adapter[12]).includes('✅')
    const hasE2ETests = unwrapCode(adapter[13]).includes('✅')
    const airtableFields = {
      Name: name,
      Version: version,
      Type: type,
      'Framework Version': frameworkVersion,
      'Default API URL': defaultApiUrl,
      Dependencies: dependencies,
      'Environment Variables': envVars,
      Endpoints: endpoints,
      'Default Endpoint': defEndpoint,
      'Batchable Endpoints': batchableEndpoints,
      'Websocket Support': isWSSupported,
      'Unit Tests': hasUnitTests,
      'Integration Tests': hasIntegrationTests,
      'E2E Tests': hasE2ETests,
    }

    if (!record) {
      tasks.push(
        base(tableName).create([
          {
            fields: airtableFields,
          },
        ]),
      )
    } else {
      // if new local version is the same as in airtable, no need to update
      if (record.version === version) {
        continue
      }
      // update
      tasks.push(
        base(tableName).update([
          {
            id: record.id,
            fields: airtableFields,
          },
        ]),
      )
    }
  }

  // in case AirTable has more records (some adapters were deleted)
  if (Object.keys(airtableRecordIds).length > adapterList.length) {
    const recordsToDelete = Object.keys(airtableRecordIds).filter(
      (record) => !adapterList.find((adapter) => adapter[0].includes(record)),
    )
    recordsToDelete.forEach((record) => {
      tasks.push(base(tableName).destroy(airtableRecordIds[record].id))
    })
  }

  return Promise.all(tasks)
}

export const generateMasterList = async (
  verbose = false,
  output: string[],
): Promise<TableText | void> => {
  try {
    const composite = getAdapterList(pathToComposites, compositeListDescription)
    const source = getAdapterList(pathToSources, sourceListDescription)
    const target = getAdapterList(pathToTargets, targetListDescription)
    const nonDeployable = getAdapterList(pathToNonDeployables, nonDeployableListDescription)

    // Fetch group-specific fields
    const allAdapters = [
      ...composite.adapters.map((name) => ({
        name,
        type: '`composite`',
        path: pathToComposites + name,
        redirect: getRedirectText(pathToComposites, name),
      })),
      ...source.adapters.map((name) => ({
        name,
        type: '`source`',
        path: pathToSources + name,
        redirect: getRedirectText(pathToSources, name),
      })),
      ...target.adapters.map((name) => ({
        name,
        type: '`target`',
        path: pathToTargets + name,
        redirect: getRedirectText(pathToTargets, name),
      })),
      ...nonDeployable.adapters.map((name) => ({
        name,
        type: '`non-deployable`',
        path: pathToNonDeployables + name,
        redirect: getRedirectText(pathToTargets, name),
      })),
    ].sort((a, b) => sortText(a.name, b.name))

    // Fetch general fields
    const allAdaptersTable: TableText = await Promise.all(
      allAdapters.map(async (adapter) => {
        const { dependencies, version, frameworkVersion } = getPackage(adapter.path, verbose)
        const { defaultBaseUrl, defaultEndpoint } = await getConfigDefaults(adapter.path, verbose)
        const envVars = getEnvVars(adapter.path, verbose)
        const { batchableEndpoints, endpointsText } = await getEndpoints(adapter.path, verbose)
        const wsSupport = await getWSSupport(adapter.path, verbose)
        const { e2e, integration, unit } = getTestSupport(adapter.path)

        return [
          adapter.redirect,
          version,
          adapter.type,
          frameworkVersion,
          defaultBaseUrl,
          dependencies,
          envVars,
          endpointsText,
          defaultEndpoint,
          batchableEndpoints,
          wsSupport,
          unit,
          integration,
          e2e,
        ]
      }),
    )

    // If no output is specified or specified value is `fs` generate and save master list data
    if (output?.length && output.includes('fs')) {
      let allAdapterText =
        'This document was generated automatically. Please see [Master List Generator](./packages/scripts#master-list-generator) for more info.\n\n'

      allAdapterText +=
        buildTable(allAdaptersTable, [
          'Name',
          'Version',
          'Type',
          'Framework Version',
          'Default API URL',
          'Dependencies',
          'Environment Variables (✅ = required)',
          'Endpoints',
          'Default Endpoint',
          'Batchable Endpoints',
          'Supports WS',
          'Unit Tests',
          'Integration Tests',
          'End-to-End Tests',
        ]) + '\n'

      saveText([
        { path: pathToComposites + 'README.md', text: composite.text },
        { path: pathToSources + 'README.md', text: source.text },
        { path: pathToTargets + 'README.md', text: target.text },
        { path: pathToNonDeployables + 'README.md', text: nonDeployable.text },
        { path: 'MASTERLIST.md', text: allAdapterText },
      ])
    }

    // If output is specified to `airtable` generate and save master list data to Airtable DB
    if (output?.length && output.includes('airtable')) {
      await generateAirtableMasterList(allAdaptersTable)
    }
  } catch (e: any) {
    const error = e as Error
    console.error({ error: error.message, stack: error.stack })
    throw error
  }
}
