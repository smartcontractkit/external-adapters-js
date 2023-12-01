import axios from 'axios-observable'
import { retryBackoff } from 'backoff-rxjs'
import { Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import console from 'console'
import { AxiosRequestConfig } from 'axios'
import { randomUUID } from 'crypto'

const rddAliases: { [name: string]: string } = {
  cvi: 'crypto-volatility-index',
} as const

// ReferenceContractConfig is the shape of reference data for a given data feed,
// which includes the address of the feed, contract version, and the node operators (nodes)
// that are being contracted for this feed.
export class ReferenceContractConfig {
  name: string
  contractVersion: number
  address: string
  data: Record<string, unknown>
  nodes: FeedNode[]
  precision: number
  deviationThreshold: number
  symbol: string
  path: string
  status: string
  category: string

  constructor(input: Record<string, unknown>) {
    const ValidationError = (param: string) =>
      Error(`Contract config "${param}" param is missing or incorrect type`)

    if (typeof input?.name !== 'string') throw ValidationError('name')
    this.name = input.name

    if (typeof input?.contractVersion !== 'number') throw ValidationError('contractVersion')
    this.contractVersion = input.contractVersion

    if (typeof input?.address !== 'string') throw ValidationError('address')
    this.address = input.address

    if (typeof input?.deviationThreshold !== 'number') throw ValidationError('deviationThreshold')
    this.deviationThreshold = input.deviationThreshold

    if (!(typeof input?.data === 'object' && !Array.isArray(input?.data) && input?.data !== null))
      throw ValidationError('data')
    this.data = input.data as Record<string, unknown>

    if (!Array.isArray(input?.nodes)) throw ValidationError('nodes')
    this.nodes = input.nodes.map((node: unknown) => new FeedNode(node))

    if (typeof input?.precision !== 'number') throw ValidationError('precision')
    this.precision = input.precision

    if (typeof input?.symbol !== 'string') throw ValidationError('symbol')
    this.symbol = input.symbol

    if (typeof input?.path !== 'string') throw ValidationError('path')
    this.path = input.path

    if (typeof input?.status !== 'string') throw ValidationError('status')
    this.status = input.status

    if (typeof input?.category !== 'string') throw ValidationError('category')
    this.category = input.category
  }
}

// FeedNode is the shape of reference data for a single node operator on a single data feed.
// The dataProviders are the data providers (usually 1-to-1 with adapters) being used by the
// node operator for a given feed.
export class FeedNode {
  name: string
  address: string
  dataProviders: string[]
  constructor(input: any) {
    const ValidationError = (param: string) => {
      Error(`Feed node "${param}" param is missing or incorrect type`)
    }

    if (typeof input?.name !== 'string') throw ValidationError('name')
    this.name = input.name

    if (typeof input?.address !== 'string') throw ValidationError('address')
    this.address = input.address

    if (
      !Array.isArray(input?.dataProviders) ||
      input.dataProviders.some((dp: unknown) => typeof dp !== 'string')
    )
      throw ValidationError('dataProviders')
    this.dataProviders = input.dataProviders
  }
}

export interface ConfigPayload {
  name: string
  data: Record<string, any>
}

export interface K6Payload {
  name: string
  id: string
  method: string
  data: string
}

export type ReferenceContractConfigResponse = {
  configs: ReferenceContractConfig[] | undefined
}

type ApiResponse = Record<string, unknown>[]
const MAX_REQUESTS = 3
const REQUEST_TIMEOUT_MS = 5000
const RETRY_BACKOFF = {
  resetOnSuccess: true,
  initialInterval: 250,
  maxRetries: MAX_REQUESTS - 1,
  maxInterval: 2000,
}

/**
 * Will fetch a config from the web
 * @param {string} configUrl The url to a config
 * @returns {ReferenceContractConfigResponse} The response data if it existed
 */
export const fetchConfigFromUrl = (
  configUrl: string,
): Observable<ReferenceContractConfigResponse> => {
  let requestAttempt = 0

  return axios.get(configUrl, { timeout: REQUEST_TIMEOUT_MS }).pipe(
    map((res: { data: ApiResponse }) => ({
      configs: parseConfig(res.data),
    })),
    catchError((err: Error) => {
      requestAttempt++
      console.error(`Error fetching config (${requestAttempt}/${MAX_REQUESTS}): ${err.message}`)

      throw err
    }),
    retryBackoff(RETRY_BACKOFF),
    catchError((err: Error) => {
      console.error(
        `Could not fetch config. Max request limit reached (${MAX_REQUESTS}/${MAX_REQUESTS}): ${err.message}`,
      )

      return of<ReferenceContractConfigResponse>({
        configs: undefined,
      })
    }),
  )
}

/**
 * Will parse the object into the ReferenceContractConfig[] if valid.
 * Will throw an error if it fails
 * @param {Record<string, unknown>[]} rawConfig The unverified input data
 * @returns {ReferenceContractConfig[]} The verified input as a config array
 */
export const parseConfig = (rawConfig: Record<string, unknown>[]): ReferenceContractConfig[] => {
  return rawConfig.map((rc) => new ReferenceContractConfig(rc))
}

/**
 * Posts the config to the url provided
 * @param {ReferenceContractConfig[]} config The configuration to post
 * @param {string} configUrl The url to post to
 */
export const setFluxConfig = (
  config: ReferenceContractConfig[],
  configUrl: string,
): Observable<void> => {
  let requestAttempt = 0
  const requestConfig: AxiosRequestConfig = {
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  }
  return axios.post<ApiResponse>(configUrl, config, requestConfig).pipe(
    map(() => {
      console.log('The posting of the new config successfully completed')
      return
    }),
    catchError((err: Error) => {
      requestAttempt++
      console.error(`Error setting config (${requestAttempt}/${MAX_REQUESTS}): ${err.message}`)

      throw err
    }),
    retryBackoff(RETRY_BACKOFF),
    catchError((err: Error) => {
      console.error(
        `Could not set config. Max request limit reached (${MAX_REQUESTS}/${MAX_REQUESTS}): ${err.message}`,
      )

      throw err
    }),
  )
}

/**
 * Add an adapter to the qa config
 * @param {string} adapterName The name of the adapter to key off of from the master config
 * @param {string} ephemeralAdapterName The name of the ephemeral adapter to add in all the places the adapterName is found
 * @param {ReferenceContractConfig[]} masterConfig The master configuration to use
 * @param {ReferenceContractConfig[]} qaConfig The qa configuration you would like to have the adapter added to
 * @returns {ReferenceContractConfig[]} The qa configuration with the adapter added in
 */
export const addAdapterToConfig = (
  adapterName: string,
  ephemeralAdapterName: string,
  masterConfig: ReferenceContractConfig[],
  qaConfig: ReferenceContractConfig[],
): ReferenceContractConfig[] => {
  for (const config of masterConfig) {
    for (const node of config.nodes) {
      for (const dataProvider of node.dataProviders) {
        const [name, params] = dataProvider.split('?')
        if (name !== adapterName && (!rddAliases[name] || rddAliases[name] !== adapterName))
          continue

        // add adapter to the qaFeed
        if (!params) {
          qaConfig = addAdapterToNode(config, node, qaConfig, ephemeralAdapterName)
        } else {
          const configWithParams = JSON.parse(JSON.stringify(config)) as ReferenceContractConfig
          const paramsList = params.split('&')
          configWithParams.name = `${configWithParams.name} ${paramsList.join(' ')}`
          for (const param of paramsList) {
            const [key, value] = param.split('=')
            configWithParams.data[key] = value
          }
          qaConfig = addAdapterToNode(configWithParams, node, qaConfig, ephemeralAdapterName)
        }
      }
    }
  }
  return qaConfig
}

const newFeedWithoutNodes = (feedConfig: ReferenceContractConfig): ReferenceContractConfig => {
  const config: ReferenceContractConfig = { ...feedConfig }
  config.nodes = []
  return config
}

const newNodeWithoutAdapters = (feedNode: FeedNode): FeedNode => {
  const node: FeedNode = { ...feedNode }
  node.dataProviders = []
  return node
}

const addAdapterToNode = (
  masterFeed: ReferenceContractConfig,
  masterNode: FeedNode,
  qaConfig: ReferenceContractConfig[],
  ephemeralAdapterName: string,
): ReferenceContractConfig[] => {
  // find the feed in the qa config
  let feedIndex: number = qaConfig.findIndex((e) => e.name === masterFeed.name)
  if (feedIndex < 0) {
    // add a feed with no nodes if a feed does not exist
    qaConfig.push(newFeedWithoutNodes(masterFeed))
    feedIndex = qaConfig.length - 1
  }

  // find the node in the qa config
  let nodeIndex: number = qaConfig[feedIndex].nodes.findIndex((e) => e.name === masterNode.name)
  if (nodeIndex < 0) {
    // add a node with no data providers if a node does not exist
    qaConfig[feedIndex].nodes.push(newNodeWithoutAdapters(masterNode))
    nodeIndex = qaConfig[feedIndex].nodes.length - 1
  }

  // add the adapter if it doesn't exist yet
  if (!qaConfig[feedIndex].nodes[nodeIndex].dataProviders.includes(ephemeralAdapterName)) {
    qaConfig[feedIndex].nodes[nodeIndex].dataProviders.push(ephemeralAdapterName)
  }

  return qaConfig
}

/**
 * Remove the adapter from the feed configuation
 * @param {string} ephemeralAdapterName The name of the adapter to remove
 * @param {ReferenceContractConfig[]} qaConfig The FeedConfig to remove the adapter from
 * @returns {ReferenceContractConfig[]} The updated qaConfig
 */
export const removeAdapterFromFeed = (
  ephemeralAdapterName: string,
  qaConfig: ReferenceContractConfig[],
): ReferenceContractConfig[] => {
  const emptyNodes = []
  for (let c = 0; c < qaConfig.length; c++) {
    const config: ReferenceContractConfig = qaConfig[c]
    for (let n = 0; n < config.nodes.length; n++) {
      const node: FeedNode = config.nodes[n]
      // remove index if adapter exists
      const index: number = node.dataProviders.indexOf(ephemeralAdapterName, 0)
      if (index > -1) {
        node.dataProviders.splice(index, 1)
      }
      // add empty nodes to a list for removal
      if (node.dataProviders.length === 0) {
        emptyNodes.unshift({ c: c, n: n })
      }
    }
  }

  // now remove any empty configs and nodes to keep the house tidy
  // first remove any empty nodes, array is already sorted in reverse
  for (const indexes of emptyNodes) {
    qaConfig[indexes.c].nodes.splice(indexes.n, 1)
  }
  // remove any configs with no nodes, always delete from arrays in reverse
  for (let i = qaConfig.length - 1; i >= 0; i--) {
    if (qaConfig[i].nodes.length === 0) {
      qaConfig.splice(i, 1)
    }
  }

  return qaConfig
}

/**
 * Converts the flux emulator config into a k6 payload
 * @param {ConfigPayload[]} referenceConfig The configuration to convert to a k6 compatible payload
 * @returns {K6Payload[]} The k6 compatible payload
 */

export const convertConfigToK6Payload = (referenceConfig: ConfigPayload[]): K6Payload[] => {
  const id = randomUUID()

  const payloads: K6Payload[] = []
  for (const config of referenceConfig) {
    const payload: K6Payload = {
      name: config.name,
      id,
      method: 'POST',
      data: JSON.stringify({ data: config.data?.data || config.data }),
    }
    payloads.push(payload)
  }
  return payloads
}

/**
 * Return whether the adapter exists in the config or now
 * @param {string} adapterName The name of the adapter to look for
 * @param {ReferenceContractConfig[]} masterConfig The configuration to look for the adapter in
 * @returns {boolean} True if the adapter exists in the config
 */
export const adapterExistsInConfig = (
  adapterName: string,
  masterConfig: ReferenceContractConfig[],
): boolean => {
  for (const config of masterConfig) {
    for (const node of config.nodes) {
      if (node.dataProviders.includes(adapterName)) {
        // we found the adapter
        return true
      }
    }
  }
  return false
}
