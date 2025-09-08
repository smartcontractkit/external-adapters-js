import { Config as BaseConfig, Requester, util } from '@chainlink/ea-bootstrap'

export const NAME = 'ONDO_GM_TOKENIZED'
export const DEFAULT_ENDPOINT = 'ondo_gm_tokenized'

export interface Config extends BaseConfig {
  ondoApiKey: string
  streamsApiKey?: string
  streamsApiSecret?: string
  baseUrl: string
  streamsBaseUrl?: string
}

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)

  return {
    ...config,
    defaultEndpoint: DEFAULT_ENDPOINT,
    ondoApiKey: util.getRequiredEnv('ONDO_API_KEY'),
    streamsApiKey: util.getRequiredEnv('STREAMS_API_KEY'),
    streamsApiSecret: util.getRequiredEnv('STREAMS_API_SECRET'),
    baseUrl: util.getEnv('ONDO_BASE_URL') || 'https://api.gm.ondo.finance',
    streamsBaseUrl: util.getEnv('STREAMS_BASE_URL') || 'https://api.dataengine.chain.link',
  }
}
