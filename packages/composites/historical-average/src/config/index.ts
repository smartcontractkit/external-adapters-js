import { adapter as CoinMarketCap } from '@chainlink/coinmarketcap-adapter'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/ea-bootstrap'
import { Adapter as AdapterImplementation } from '@chainlink/external-adapter-framework/adapter'

export type SourceRequestOptions = { [source: string]: DefaultConfig }
export const NAME = 'HISTORICAL_AVERAGE'

export type Config = DefaultConfig & {
  sources: SourceRequestOptions
  defaultSource?: string
}

export const adapters: AdapterImplementation[] = [CoinMarketCap as AdapterImplementation]

export type Source = (typeof adapters)[number]['name']

export const makeConfig = (prefix = ''): Config => {
  const sources: SourceRequestOptions = {}

  for (const a of adapters) {
    const name = a.name
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
