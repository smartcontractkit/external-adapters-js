import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { ethers } from 'ethers'
import { BATCH_WRITER_ABI, EC_REGISTRY_ABI, EC_REGISTRY_MAP_ABI } from '../abis'

export const NAME = 'GALAXIS'

export const DEFAULT_ENDPOINT = 'nba'
export const DEFAULT_EC_REGISTRY_ADDRESS = '0x3ae233ED7Bc9D055CC14Fa8f3C5620612428a838'
export const DEFAULT_CHAIN_BATCH_WRITE_ADAPTER_ADDRESS =
  '0xCb2445BD39f6143000997a2EF44F1AFe20bB4f4E'
export const DEFAULT_EC_REGISTRY_MAP_ADDRESS = '0x0b407d055098Ce336dDF9C2845CECCF22cE0b377'
export const DEFAULT_API_ENDPOINT =
  'https://cdn.nba.com/static/json/staticData/NFTNightlyAchievements/2022'
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
