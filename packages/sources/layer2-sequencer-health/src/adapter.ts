import { ExecuteFactory } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { BASE_URLS, ExtendedConfig, Networks, makeConfig } from './config'

export const inputParameters: InputParameters = {
  network: true,
}

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
      baseUrl: BASE_URLS[network],
      url: '/rpc',
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
    const _isPastBlock = (network: Networks, block: string) =>
      lastSeenBlockHeights[network].block === block
    return (
      _isPastBlock(network, block) && Date.now() - lastSeenBlockHeights[network].timestamp > delta
    )
  }

  const updateSeenLastBlock = (network: Networks, block: string): void => {
    lastSeenBlockHeights[network] = {
      block,
      timestamp: Date.now(),
    }
  }

  return async (network: Networks, delta: number): Promise<boolean> => {
    const block = await requestBlockHeight(network)
    if (!isStaleBlock(network, block, delta)) {
      updateSeenLastBlock(network, block)
      return true
    }
    return false
  }
}

const getNetworkStatus = makeNetworkStatusCheck()

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const network = validator.validated.data.network as Networks

  // #1 Option: Direct check on health endpoint
  // TODO

  // #2 Option: Check block height
  const isHealthy = await getNetworkStatus(network, config.delta)

  // #3 Option: Check L1 Rollup Contract
  // TODO

  return Requester.success(jobRunID, { data: { result: isHealthy } }, config.verbose)
}

export const makeExecute: ExecuteFactory<ExtendedConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
