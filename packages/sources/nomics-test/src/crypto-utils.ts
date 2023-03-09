import { config } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'ids'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market', 'convert'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
} as const

export interface RequestParams {
  base: string
  quote: string
}

interface PriceInfo {
  volume: string
  price_change: string
  price_change_pct: string
  volume_change: string
  volume_change_pct: string
  market_cap_change: string
  market_cap_change_pct: string
}

export interface ResponseSchema {
  id: string
  currency: string
  symbol: string
  name: string
  logo_url: string
  status: string
  price: string
  price_date: string
  price_timestamp: string
  circulating_supply: string
  max_supply: string
  market_cap: string
  num_exchanges: string
  num_pairs: string
  num_pairs_unmapped: string
  first_candle: string
  first_trade: string
  first_order_book: string
  rank: string
  rank_delta: string
  high: string
  high_timestamp: string
  '1d': PriceInfo
  '7d': PriceInfo
  '30d': PriceInfo
  '365d': PriceInfo
  ytd: PriceInfo
}

export type CryptoEndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema[]
  }
}

const getMappedQuotes = (requestParams: RequestParams[]) => {
  const quoteGroupMap: Record<string, { ids: string[]; convert: string }> = {}
  requestParams.forEach((param) => {
    const base = param.base.toUpperCase()
    const quote = param.quote.toUpperCase()

    if (!quoteGroupMap[quote]) {
      quoteGroupMap[quote] = {
        convert: quote,
        ids: [],
      }
    }

    if (!quoteGroupMap[quote].ids) {
      quoteGroupMap[quote].ids = [base]
    } else {
      quoteGroupMap[quote].ids.push(base)
    }
  })

  return quoteGroupMap
}

export const buildCryptoRequestBody = (
  baseUrl = '',
  apiKey: string,
  requestParams: RequestParams[],
) => {
  // Nomics supports batching only for base params (ids) so we are grouping requestParams by quotes meaning we will send N number of requests to DP where the N is number of unique quotes
  const groupedQuotes = getMappedQuotes(requestParams)

  return Object.values(groupedQuotes).map((record) => {
    return {
      params: requestParams.filter((param) => param.quote === record.convert),
      request: {
        baseURL: baseUrl,
        url: '/currencies/ticker',
        params: { ...record, key: apiKey, ids: [...new Set(record.ids)].join(',') },
      },
    }
  })
}
