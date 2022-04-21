import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { ethers } from 'ethers'
import { BATCH_WRITER_ABI, EC_REGISTRY_ABI, EC_REGISTRY_MAP_ABI } from '../abis'

export const NAME = 'GALAXIS'

export const DEFAULT_ENDPOINT = 'nba'
export const DEFAULT_EC_REGISTRY_ADDRESS = '0xbEfe904f4649c3381E94fcBC583cB9cF84c1A888'
export const DEFAULT_CHAIN_BATCH_WRITE_ADAPTER_ADDRESS =
  '0xB52ed9ee9Ee4FD18fd04b2e6d6665629E6F37AB0'
export const DEFAULT_EC_REGISTRY_MAP_ADDRESS = '0x650BE994523d2A71A397fABC11AcB29c57a689D0'
export const DEFAULT_API_ENDPOINT =
  'https://cdn.nba.com/static/json/staticData/NFTNightlyAchievements'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export interface ExtendedConfig extends Config {
  ecRegistry: ethers.Contract
  ecRegistryMap: ethers.Contract
  batchWriter: ethers.Contract
  provider: ethers.providers.JsonRpcProvider
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const config = Requester.getDefaultConfig(prefix)
  config.rpcUrl = util.getRequiredEnv('POLYGON_RPC_URL', prefix)
  config.api.baseURL = util.getEnv('API_ENDPOINT', prefix) || DEFAULT_API_ENDPOINT
  config.defaultEndpoint = DEFAULT_ENDPOINT
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const ecRegistryAddress =
    util.getEnv('EC_REGISTRY_ADDRESS', prefix) || DEFAULT_EC_REGISTRY_ADDRESS
  const ecRegistryMapAddress =
    util.getEnv('EC_REGISTRY_MAP_ADDRESS', prefix) || DEFAULT_EC_REGISTRY_MAP_ADDRESS
  const batchWriterAddress =
    util.getEnv('CHAIN_BATCH_WRITE_ADAPTER_ADDRESS', prefix) ||
    DEFAULT_CHAIN_BATCH_WRITE_ADAPTER_ADDRESS
  return {
    ...config,
    ecRegistry: new ethers.Contract(ecRegistryAddress, EC_REGISTRY_ABI, provider),
    ecRegistryMap: new ethers.Contract(ecRegistryMapAddress, EC_REGISTRY_MAP_ABI, provider),
    batchWriter: new ethers.Contract(batchWriterAddress, BATCH_WRITER_ABI, provider),
    provider,
  }
}
