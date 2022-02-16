import * as CoinMarketCap from '@chainlink/coinmarketcap-adapter'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { AdapterImplementation, Config as DefaultConfig } from '@chainlink/types'

export type SourceRequestOptions = { [source: string]: DefaultConfig }
export const NAME = 'HISTORICAL_AVERAGE'

export type Config = DefaultConfig & {
  sources: SourceRequestOptions
  defaultSource?: string
}

export const adapters: AdapterImplementation[] = [CoinMarketCap]

export type Source = typeof adapters[number]['NAME']

export const makeConfig = (prefix = ''): Config => {
  const sources: SourceRequestOptions = {}

  for (const a of adapters) {
    const name = a.NAME
    const url = util.getURL(name.toUpperCase())
    if (url) {
      const defaultConfig = Requester.getDefaultConfig(prefix)
      defaultConfig.api.baseURL = url
      defaultConfig.api.method = 'post'
      sources[name.toLowerCase()] = defaultConfig
    }
  }

  return {
    sources,
    defaultSource: util.getEnv('DEFAULT_SOURCE'),
  }
}
