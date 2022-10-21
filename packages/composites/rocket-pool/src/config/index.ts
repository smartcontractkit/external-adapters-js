import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

export const NAME = 'ROCKET_POOL'

export const DEFAULT_ENDPOINT = 'reth'
export const ETHEREUM_CHAIN_ID = '1'
export const DEFAULT_ETH_USD_PROXY_ADDRESS = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
export const RETH_TOKEN_CONTRACT = '0xae78736Cd615f374D3085123A210448E74Fc6393'

export const makeConfig = (prefix?: string): Config => {
  const ethereumRpcUrl = util.getRequiredEnv('ETHEREUM_RPC_URL')
  const priceRpcUrl = util.getRequiredEnvWithFallback('PRICE_RPC_URL', ['ETHEREUM_RPC_URL'])
  const priceChainId = util.getEnv('PRICE_CHAIN_ID') ?? ETHEREUM_CHAIN_ID
  const ethUsdProxy = util.getEnv('ETH_USD_PROXY_ADDRESS') ?? DEFAULT_ETH_USD_PROXY_ADDRESS

  const config = {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    ethereumProvider: new ethers.providers.JsonRpcProvider(ethereumRpcUrl, ETHEREUM_CHAIN_ID),
    priceProvider: new ethers.providers.JsonRpcProvider(priceRpcUrl, priceChainId),
    ethUsdProxy,
  }

  return config
}
