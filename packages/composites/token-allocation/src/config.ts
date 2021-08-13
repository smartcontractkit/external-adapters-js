import Amberdata from '@chainlink/amberdata-adapter'
import CoinApi from '@chainlink/coinapi-adapter'
import CoinGecko from '@chainlink/coingecko-adapter'
import CoinMarketCap from '@chainlink/coinmarketcap-adapter'
import CoinPaprika from '@chainlink/coinpaprika-adapter'
import CryptoCompare from '@chainlink/cryptocompare-adapter'
import { Requester, util } from '@chainlink/ea-bootstrap'
import Kaiko from '@chainlink/kaiko-adapter'
import Nomics from '@chainlink/nomics-adapter'
import Tiingo from '@chainlink/tiingo-adapter'
import { AdapterImplementation } from '@chainlink/types'
import { Config, SourceRequestOptions } from './types'

export const adapters: AdapterImplementation[] = [
  Amberdata,
  CoinApi,
  CoinGecko,
  CoinMarketCap,
  CoinPaprika,
  CryptoCompare,
  Kaiko,
  Nomics,
  Tiingo,
]

export type Source = typeof adapters[number]['NAME']

export const DEFAULT_TOKEN_DECIMALS = 18
export const DEFAULT_TOKEN_BALANCE = 1

export const LEGACY_ENV_ADAPTER_URL = 'ADAPTER_URL'
export const ENV_ADAPTER_URL = 'ADAPTER_URL'

export const getURL = (prefix: string, required = false): string | undefined =>
  required
    ? util.getRequiredEnv(ENV_ADAPTER_URL, prefix) ||
      util.getRequiredEnv(LEGACY_ENV_ADAPTER_URL, prefix)
    : util.getEnv(ENV_ADAPTER_URL, prefix) || util.getEnv(LEGACY_ENV_ADAPTER_URL, prefix)

export const makeConfig = (prefix = ''): Config => {
  const sources: SourceRequestOptions = {}

  for (const a of adapters) {
    const name = a.NAME
    const url = getURL(name.toUpperCase())
    if (url) {
      const defaultConfig = Requester.getDefaultConfig(prefix)
      defaultConfig.api.baseURL = url
      defaultConfig.api.method = 'post'
      sources[name.toLowerCase()] = defaultConfig
    }
  }

  return {
    sources,
    defaultMethod: util.getEnv('DEFAULT_METHOD', prefix) || 'price',
    defaultQuote: util.getEnv('DEFAULT_QUOTE') || 'USD',
    defaultSource: util.getEnv('DEFAULT_SOURCE'),
  }
}

export const makeOptions = ({ sources }: Config) => {
  const sourceOptions = Object.keys(sources).map((s) => s.toLowerCase())
  return {
    source: sourceOptions,
  }
}
