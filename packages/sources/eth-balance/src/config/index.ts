import { Logger, Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

export const NAME = 'ETH_BALANCE'

export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'
export const ENV_ETHEREUM_CHAIN_ID = 'ETHEREUM_CHAIN_ID'
export const ENV_FALLBACK_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'
export const DEFAULT_ENDPOINT = 'balance'
const _RPC_CHAIN_ID = '_RPC_CHAIN_ID'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
  chainIdToProviderMap: Map<string, ethers.providers.Provider>
}

// reverse mapping from chain ID to network to RPC url
const constructChainIdProviderMap = (): Map<string, ethers.providers.Provider> => {
  const chainIdToProviderMap = new Map<string, ethers.providers.Provider>()

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.endsWith(_RPC_CHAIN_ID)) continue

    const chainId = value

    if (!chainId) {
      Logger.warn(`env var ${key} is incorrect`)
      continue
    }
    if (chainIdToProviderMap.has(chainId)) {
      Logger.warn(`chain ID ${chainId} present multiple times`)
      continue
    }

    // extract network name from XXX_RPC_CHAIN_ID & get RPC_URL
    const networkName = key.split(_RPC_CHAIN_ID)[0]
    const rpcEnvVar = `${networkName}_RPC_URL`
    const rpcUrl = process.env[rpcEnvVar]

    if (!rpcUrl) {
      Logger.warn(`Missing RPC_URL for ${networkName}`)
      continue
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, Number(chainId))
    chainIdToProviderMap.set(chainId, provider)
    Logger.info(`created provider for network: ${networkName}, chain ID: ${chainId}`)
  }
  return chainIdToProviderMap
}

export const makeConfig = (prefix?: string): Config => {
  const rpcURL = util.getRequiredEnvWithFallback(
    ENV_ETHEREUM_RPC_URL,
    [ENV_FALLBACK_RPC_URL],
    prefix,
  )
  const chainId =
    parseInt(
      util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID]) || DEFAULT_CHAIN_ID,
    ) || util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID])

  const chainIdToProviderMap = constructChainIdProviderMap()

  Logger.info('creating new Json RPC Provider')
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    provider: new ethers.providers.JsonRpcProvider(rpcURL, chainId),
    chainIdToProviderMap,
  }
}
