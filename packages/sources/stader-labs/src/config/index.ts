import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'STADER_LABS'
export const DEFAULT_ENDPOINT = 'maticx'

export const ENV_POLYGON_RPC_URL = 'POLYGON_RPC_URL'
export const ENV_POLYGON_CHAIN_ID = 'POLYGON_CHAIN_ID'
export const DEFAULT_POLYGON_CHAIN_ID = '137'

export const ENV_FANTOM_RPC_URL = 'FANTOM_RPC_URL'
export const ENV_FANTOM_CHAIN_ID = 'FANTOM_CHAIN_ID'
export const DEFAULT_FANTOM_CHAIN_ID = '250'

export const ENV_BSC_RPC_URL = 'BSC_RPC_URL'
export const ENV_BSC_CHAIN_ID = 'BSC_CHAIN_ID'
export const DEFAULT_BSC_CHAIN_ID = '56'

export const MATIC_AGGREGATOR_PROXY = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
export const MATICX_RATE_PROVIDER =
  util.getEnv('MATICX_RATE_PROVIDER') || '0xeE652bbF72689AA59F0B8F981c9c90e2A8Af8d8f'
export const FANTOM_AGGREGATOR_PROXY = '0xf4766552d15ae4d256ad41b6cf2933482b0680dc'
export const SFTMX_RATE_PROVIDER =
  util.getEnv('SFTMX_RATE_PROVIDER') || '0xb458bfc855ab504a8a327720fcef98886065529b'
export const BSC_AGGREGATOR_PROXY = '0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee'
export const BNBX_RATE_PROVIDER =
  util.getEnv('BNBX_RATE_PROVIDER') || '0x3b961e83400D51e6E1AF5c450d3C7d7b80588d28'

export const BNBX_RATE_MULTIPLIER = util.getEnv('BNBX_RATE_MULTIPLIER') || '1000000000000000000'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.adapterSpecificParams = {
    polygonRpcUrl: util.getEnv(ENV_POLYGON_RPC_URL) || '',
    polygonChainId:
      parseInt(util.getEnv(ENV_POLYGON_CHAIN_ID) || DEFAULT_POLYGON_CHAIN_ID) ||
      (util.getEnv(ENV_POLYGON_CHAIN_ID) as string),
    fantomRpcUrl: util.getEnv(ENV_FANTOM_RPC_URL) || '',
    fantomChainId:
      parseInt(util.getEnv(ENV_FANTOM_CHAIN_ID) || DEFAULT_FANTOM_CHAIN_ID) ||
      (util.getEnv(ENV_FANTOM_CHAIN_ID) as string),
    bscRpcUrl: util.getEnv(ENV_BSC_RPC_URL) || '',
    bscChainId:
      parseInt(util.getEnv(ENV_BSC_CHAIN_ID) || DEFAULT_BSC_CHAIN_ID) ||
      (util.getEnv(ENV_BSC_CHAIN_ID) as string),
  }
  return config
}
