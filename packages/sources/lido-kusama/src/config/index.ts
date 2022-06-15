import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'LIDO_KUSAMA'
export const LIDO_ADDRESS = '0xFfc7780C34B450d917d557E728f033033CB4fA8C'
export const WITHDRAWAL_ADDRESS = '0x8d24EF5B84d99b1871Eef84b4999b97B96eCfba7'
export const KSM_AGGREGATOR_PROXY = '0x6e0513145FCE707Cd743528DB7C1cAB537DE9d1B'
export const DEFAULT_ENDPOINT = 'stksm'
export const OUTPUT_DECIMALS = 8
export const KSM_DECIMALS = 12

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL ||=
    util.getEnv('MOONRIVER_RPC_URL') || 'https://rpc.moonriver.moonbeam.network/'
  config.api.relayURL ||= util.getEnv('KUSAMA_RPC_URL') || 'wss://kusama-rpc.polkadot.io/'
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
