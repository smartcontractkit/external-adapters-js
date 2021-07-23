import { ExecuteFactory } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { RPC_ENDPOINTS, ExtendedConfig, Networks, makeConfig, HEALTH_ENDPOINTS } from './config'

const getSequencerHealth = async (network: Networks): Promise<boolean> => {
  if (!HEALTH_ENDPOINTS[network]) {
    throw new Error(`Health endpoint not supported for network: ${network}`)
  }
  const response = await Requester.request({
    url: HEALTH_ENDPOINTS[network]?.endpoint,
  })
  return !!Requester.getResult(response.data, HEALTH_ENDPOINTS[network]?.responsePath)
}

// TODO: Unit tests on getStatus
const makeNetworkStatusCheck = () => {
  const lastSeenBlockHeights = {
    [Networks.Arbitrum]: {
      block: '',
      timestamp: 0,
    },
    [Networks.Optimism]: {
      block: '',
      timestamp: 0,
    },
  }

  const requestBlockHeight = async (network: Networks): Promise<string> => {
    const request = {
      method: 'POST',
      url: RPC_ENDPOINTS[network],
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 83,
      },
    }
    const response = await Requester.request(request)
    return response?.data.result
  }

  const isStaleBlock = (network: Networks, block: string, delta: number): boolean => {
    const _isPastBlock = (block: string) => lastSeenBlockHeights[network].block === block
    return _isPastBlock(block) && Date.now() - lastSeenBlockHeights[network].timestamp > delta
  }

  const updateLastSeenBlock = (network: Networks, block: string): void => {
    lastSeenBlockHeights[network] = {
      block,
      timestamp: Date.now(),
    }
  }

  return async (network: Networks, delta: number): Promise<boolean> => {
    const block = await requestBlockHeight(network)
    if (!isStaleBlock(network, block, delta)) {
      updateLastSeenBlock(network, block)
      return true
    }
    return false
  }
}

const getNetworkStatus = makeNetworkStatusCheck()

export const inputParameters: InputParameters = {
  network: true,
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const network = validator.validated.data.network as Networks

  const _tryCatch = (fn: any) => async (...args: any[]): Promise<boolean> => {
    try {
      return await fn(...args)
    } catch (e) {
      console.error(e)
    }
    return false
  }
  // #1 Option: Direct check on health endpoint (getSequencerHealth)
  // #2 Option: Check block height (getNetworkStatus)
  const isHealthy = await [getSequencerHealth, getNetworkStatus].reduce(async (prev, fn) => {
    const res = await _tryCatch(fn)(network, config.delta)
    return res && prev
  }, Promise.resolve(true))

  // #3 Option: Check L1 Rollup Contract
  // TODO

  return Requester.success(jobRunID, { data: { isHealthy, result: isHealthy } }, config.verbose)
}

export const makeExecute: ExecuteFactory<ExtendedConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
