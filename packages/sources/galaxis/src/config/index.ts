import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { ethers } from 'ethers'
import { BATCH_WRITER_ABI, EC_REGISTRY_ABI, EC_REGISTRY_MAP_ABI } from '../abis'

export const NAME = 'GALAXIS'

export const DEFAULT_ENDPOINT = 'nba'
export const DEFAULT_EC_REGISTRY_ADDRESS = '0xf882B1A26Fc5C42005A055f7545150959dED27a8'
export const DEFAULT_CHAIN_BATCH_WRITE_ADAPTER_ADDRESS =
  '0xCF01E438E6bC82653a65273f215Ae5e5D19B1B33'
export const DEFAULT_EC_REGISTRY_MAP_ADDRESS = '0x7cdF091AF6a9ED75E3192500d3e5BB0f63e22Dea'

export interface ExtendedConfig extends Config {
  ecRegistry: ethers.Contract
  ecRegistryMap: ethers.Contract
  batchWriter: ethers.Contract
  provider: ethers.providers.JsonRpcProvider
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = util.getRequiredEnv('API_ENDPOINT', prefix)
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
    rpcUrl: util.getRequiredEnv('POLYGON_RPC_URL', prefix),
    ecRegistry: new ethers.Contract(ecRegistryAddress, EC_REGISTRY_ABI, provider),
    ecRegistryMap: new ethers.Contract(ecRegistryMapAddress, EC_REGISTRY_MAP_ABI, provider),
    batchWriter: new ethers.Contract(batchWriterAddress, BATCH_WRITER_ABI, provider),
    provider,
  }
}
