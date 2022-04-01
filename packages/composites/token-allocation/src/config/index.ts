import { Requester, util } from '@chainlink/ea-bootstrap'
import { AdapterImplementation } from '@chainlink/ea-bootstrap'
import { Config, SourceRequestOptions } from '../types'
import * as Amberdata from '@chainlink/amberdata-adapter'
import * as CFBenchmarks from '@chainlink/cfbenchmarks-adapter'
import * as CoinApi from '@chainlink/coinapi-adapter'
import * as CoinGecko from '@chainlink/coingecko-adapter'
import * as CoinMarketCap from '@chainlink/coinmarketcap-adapter'
import * as CoinMetrics from '@chainlink/coinmetrics-adapter'
import * as CoinPaprika from '@chainlink/coinpaprika-adapter'
import * as CryptoCompare from '@chainlink/cryptocompare-adapter'
import * as Finage from '@chainlink/finage-adapter'
import * as Kaiko from '@chainlink/kaiko-adapter'
import * as Nomics from '@chainlink/nomics-adapter'
import * as NCFX from '@chainlink/ncfx-adapter'
import * as Tiingo from '@chainlink/tiingo-adapter'

// TODO types
export const adapters: AdapterImplementation[] = [
  Amberdata as any,
  CFBenchmarks as any,
  CoinApi as any,
  CoinGecko as any,
  CoinMarketCap as any,
  CoinMetrics as any,
  CoinPaprika as any,
  CryptoCompare as any,
  Finage as any,
  Kaiko as any,
  NCFX as any,
  Nomics as any,
  Tiingo as any,
]

export type Source = typeof adapters[number]['NAME']

export const DEFAULT_TOKEN_DECIMALS = 18
export const DEFAULT_TOKEN_BALANCE = 1

export const NAME = 'TOKEN_ALLOCATION'

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
    defaultMethod: util.getEnv('DEFAULT_METHOD', prefix) || 'price',
    defaultQuote: util.getEnv('DEFAULT_QUOTE') || 'USD',
    defaultSource: util.getEnv('DEFAULT_SOURCE'),
  }
}

export const makeOptions = ({
  sources,
}: Config): {
  source: string[]
} => {
  const sourceOptions = Object.keys(sources).map((s) => s.toLowerCase())
  return {
    source: sourceOptions,
  }
}
