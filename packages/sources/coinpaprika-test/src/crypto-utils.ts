import { AdapterConfig, SettingsMap } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { DEFAULT_API_ENDPOINT, PRO_API_ENDPOINT } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('CoinPaprika Crypto Batched')

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  coinid: {
    description: 'The coin ID (optional to use in place of `base`)',
    required: false,
    type: 'string',
  },
} as const

export interface CryptoRequestBody {
  quotes: string
}

export interface CryptoResponseSchema {
  id: string
  name: string
  symbol: string
  rank: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  beta_value: number
  first_data_at: string
  last_updated: string
  quotes: {
    [key: string]: {
      price: number
      volume_24h: number
      volume_24h_change_24h: number
      market_cap: number
      market_cap_change_24h: number
      percent_change_15m: number
      percent_change_30m: number
      percent_change_1h: number
      percent_change_6h: number
      percent_change_12h: number
      percent_change_24h: number
      percent_change_7d: number
      percent_change_30d: number
      percent_change_1y: number
      ath_price: number
      ath_date: string
      percent_from_price_ath: number
    }
  }
  cost?: number
}

export interface CryptoRequestParams {
  coinid?: string
  base?: string
  quote: string
}

export type EndpointTypes = {
  Request: {
    Params: CryptoRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: CryptoRequestBody
    ResponseBody: CryptoResponseSchema[]
  }
}

export type EndpointTypesSingle = {
  Request: {
    Params: CryptoRequestParams
  }
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: CryptoRequestBody
    ResponseBody: CryptoResponseSchema
  }
}

const charsToEncode = {
  ':': '%3A',
  '/': '%2F',
  '?': '%3F',
  '#': '%23',
  '[': '%5B',
  ']': '%5D',
  '@': '%40',
  '!': '%21',
  $: '%24',
  '&': '%26',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
  '+': '%2B',
  ',': '%2C',
  ';': '%3B',
  '=': '%3D',
  '%': '%25',
  ' ': '%20',
  '"': '%22',
  '<': '%3C',
  '>': '%3E',
  '{': '%7B',
  '}': '%7D',
  '|': '%7C',
  '^': '%5E',
  '`': '%60',
  '\\': '%5C',
}

const stringHasWhitelist = (str: string, whitelist: string[]): boolean =>
  whitelist.some((el) => str.includes(el))

const percentEncodeString = (str: string, whitelist: string[]): string =>
  str
    .split('')
    .map((char) => {
      const encodedValue = charsToEncode[char as keyof typeof charsToEncode]
      return encodedValue && !whitelist.includes(char) ? encodedValue : char
    })
    .join('')

export const buildUrlPath = (pathTemplate = '', params = {}, whitelist = ''): string => {
  const allowedChars = whitelist.split('')

  for (const param in params) {
    const value = params[param as keyof typeof params]
    if (!value) continue

    // If string contains a whitelisted character: manually replace any non-whitelisted characters with percent encoded values. Otherwise, encode the string as usual.
    const encodedValue = stringHasWhitelist(value, allowedChars)
      ? percentEncodeString(value, allowedChars)
      : encodeURIComponent(value)

    pathTemplate = pathTemplate.replace(`:${param}`, encodedValue)
  }

  return pathTemplate
}

export const buildBatchedRequestBody = (params: CryptoRequestParams[], config: AdapterConfig) => {
  const headers: { Authorization?: string } = {}
  if (config.API_KEY) {
    headers['Authorization'] = config.API_KEY
  }
  return {
    params,
    request: {
      baseURL: config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT,
      url: 'v1/tickers',
      method: 'GET',
      headers,
      params: {
        quotes: [...new Set(params.map((p) => p.quote.toUpperCase()))].join(','),
      },
    },
  }
}

export const constructEntry = (
  res: CryptoResponseSchema[],
  requestPayload: CryptoRequestParams,
  resultPath: 'price' | 'market_cap' | 'volume_24h',
) => {
  const coinId = requestPayload.coinid ?? (requestPayload.base as string)
  const dataForCoin = res.find((s) => s.id === coinId)
  const dataForQuote = dataForCoin
    ? dataForCoin.quotes[requestPayload.quote][resultPath]
    : undefined
  if (!dataForQuote) {
    logger.warn(`Data for "${requestPayload.quote}" not found for token "${coinId}`)
    return
  }
  const entry = {
    params: requestPayload,
    response: {
      data: {
        result: dataForQuote,
      },
      result: dataForQuote,
    },
  }
  if (requestPayload.coinid) {
    entry.params.coinid = requestPayload.coinid
  } else {
    entry.params.base = requestPayload.base
  }
  return entry
}
