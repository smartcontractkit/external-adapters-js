import { ls, test } from 'shelljs'
import {
  compositeListDescription,
  sourceListDescription,
  targetListDescription,
} from './textAssets'
import { buildTable, TableText } from '../shared/tableUtils'
import {
  codeList,
  getJsonFile,
  localPathToRoot,
  saveText,
  sortText,
  wrapCode,
} from '../shared/docGenUtils'
import { EndpointDetails, Package, Schema } from '../shared/docGenTypes'

const pathToComposites = 'packages/composites/'
const pathToSources = 'packages/sources/'
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

    const config = await require(localPathToRoot + configPath)

    if (config.DEFAULT_BASE_URL) defaultBaseUrl = wrapCode(config.DEFAULT_BASE_URL)
    else if (config.DEFAULT_API_ENDPOINT) defaultBaseUrl = wrapCode(config.DEFAULT_API_ENDPOINT)
    if (config.DEFAULT_ENDPOINT) defaultEndpoint = wrapCode(config.DEFAULT_ENDPOINT)

    return { defaultBaseUrl, defaultEndpoint }
  } catch (error) {
    if (verbose) console.error({ error: error.message, stack: error.stack })
    return { defaultBaseUrl, defaultEndpoint }
  }
}

const getEndpoints = async (adapterPath: string, verbose = false) => {
  let endpointsText = 'Unknown'
  let batchableEndpoints = 'Unknown'
  try {
    const indexPath = adapterPath + '/src/endpoint/index.ts'

    const endpointDetails: EndpointDetails = await require(localPathToRoot + indexPath)

    const endpoints = Object.keys(endpointDetails)

    const allSupportedEndpoints = endpoints.reduce((list: string[], e) => {
      const supportedEndpoints = endpointDetails[e].supportedEndpoints ?? []
      list.push(...supportedEndpoints)
      return list
    }, [])

    const allBatchableEndpoints = endpoints.filter((e) => endpointDetails[e].batchablePropertyPath)

    endpointsText = allSupportedEndpoints.length ? codeList(allSupportedEndpoints) : ''

    batchableEndpoints = allBatchableEndpoints.length ? codeList(allBatchableEndpoints) : ''

    return { endpointsText, batchableEndpoints }
  } catch (error) {
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
  } catch (error) {
    if (verbose) console.error({ error: error.message, stack: error.stack })
    return 'Unknown'
  }
}

const getPackage = (adapterPath: string, verbose = false) => {
  let dependencies = 'Unknown'
  let version = 'Unknown'
  try {
    const packagePath = adapterPath + '/package.json'
    const packageJson = getJsonFile(packagePath) as Package

    if (packageJson.version) version = wrapCode(packageJson.version)

    if (packageJson.dependencies) {
      let dependencyList = Object.keys(packageJson.dependencies)

      dependencyList = dependencyList.reduce((list: string[], dep) => {
        const depSplit = dep.split('/')
        if (depSplit[0] === '@chainlink' && !baseEaDependencies.includes(depSplit[1]))
          list.push(wrapCode(depSplit[1]))
        return list
      }, [])

      dependencies = dependencyList.length ? codeList(dependencyList) : ''
    }

    return { dependencies, version }
  } catch (error) {
    if (verbose) console.error({ error: error.message, stack: error.stack })
    return { dependencies, version }
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
    const adapterFile = await require(localPathToRoot + adapterPath + '/src/adapter.ts')

    return adapterFile.makeWSHandler ? '✅' : ''
  } catch (error) {
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

export const generateMasterList = async (verbose = false): Promise<void> => {
  try {
    const composite = getAdapterList(pathToComposites, compositeListDescription)
    const source = getAdapterList(pathToSources, sourceListDescription)
    const target = getAdapterList(pathToTargets, targetListDescription)

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
    ].sort((a, b) => sortText(a.name, b.name))

    // Fetch general fields
    const allAdaptersTable: TableText = await Promise.all(
      allAdapters.map(async (adapter) => {
        const { dependencies, version } = getPackage(adapter.path, verbose)
        const { defaultBaseUrl, defaultEndpoint } = await getConfigDefaults(adapter.path, verbose)
        const envVars = getEnvVars(adapter.path, verbose)
        const { batchableEndpoints, endpointsText } = await getEndpoints(adapter.path, verbose)
        const wsSupport = await getWSSupport(adapter.path, verbose)
        const { e2e, integration, unit } = getTestSupport(adapter.path)

        return [
          adapter.redirect,
          version,
          adapter.type,
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

    let allAdapterText =
      'This document was generated automatically. Please see [Master List Generator](./packages/scripts#master-list-generator) for more info.\n\n'

    allAdapterText +=
      buildTable(allAdaptersTable, [
        'Name',
        'Version',
        'Type',
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
      { path: 'MASTERLIST.md', text: allAdapterText },
    ])
  } catch (error) {
    console.error({ error: error.message, stack: error.stack })
    throw Error(error)
  }
}
