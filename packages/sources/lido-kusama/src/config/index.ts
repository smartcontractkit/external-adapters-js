import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'LIDO_KUSAMA'
export const KSM_AGGREGATOR_PROXY = '0x6e0513145FCE707Cd743528DB7C1cAB537DE9d1B'
export const STKSM_RATE_PROVIDER = '0x77D4b212770A7cA26ee70b1E0f27fC36da191c53'
export const DEFAULT_ENDPOINT = 'stksm'
export const OUTPUT_DECIMALS = 8

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL ||= util.getEnv('MOONRIVER_RPC_URL') || ''
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
