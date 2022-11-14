import { customSettings } from './config'
import { HttpRequestConfig } from '@chainlink/external-adapter-framework/transports'

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
  '1d': {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
  '7d': {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
  '30d': {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
  '365d': {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
  ytd: {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
}

export interface ProviderResponseBody {
  ids: string
  convert: string
  key: string
}

export type CryptoEndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderResponseBody
    ResponseBody: ResponseSchema[]
  }
}

export const buildCryptoRequestBody = (
  baseUrl = '',
  apiKey: string,
  data: RequestParams,
): HttpRequestConfig<ProviderResponseBody> => {
  const baseURL = baseUrl
  const params = {
    ids: data.base.toUpperCase(),
    convert: data.quote.toUpperCase(),
    key: apiKey,
  }
  return {
    baseURL,
    url: '/currencies/ticker',
    params,
  }
}
