import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'
import { ethers } from 'ethers'

export const NAME = 'CRYPTEX'
export const DEFAULT_ENDPOINT = 'btc-dominance'

export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'

const DEFAULT_BTC_MCAP_ADDRESS = '0x47E1e89570689c13E723819bf633548d611D630C'
const DEFAULT_TOTAL_MCAP_ADDRESS = '0xEC8761a0A73c34329CA5B1D3Dc7eD07F30e836e2'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
  btcMcapAddress: string
  totalMcapAddress: string
}

export const makeConfig = (prefix?: string): Config => {
  const rpcURL = util.getRequiredEnvWithFallback(
    ENV_ETHEREUM_RPC_URL,
    [ENV_FALLBACK_RPC_URL],
    prefix,
  )
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    btcMcapAddress: util.getEnv('BTC_MCAP_ADDRESS', prefix) || DEFAULT_BTC_MCAP_ADDRESS,
    totalMcapAddress: util.getEnv('TOTAL_MCAP_ADDRESS', prefix) || DEFAULT_TOTAL_MCAP_ADDRESS,
    provider: new ethers.providers.JsonRpcProvider(rpcURL),
  }
}
