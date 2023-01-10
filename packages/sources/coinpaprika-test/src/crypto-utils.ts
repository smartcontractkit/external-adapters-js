import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings, getApiEndpoint, getApiHeaders } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

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
  base: string
  quote: string
}

export type EndpointTypes = {
  Request: {
    Params: CryptoRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: CryptoRequestBody
    ResponseBody: CryptoResponseSchema[]
  }
}

const chunkArray = (params: CryptoRequestParams[], size = 3): CryptoRequestParams[][] =>
  params.length > size ? [params.slice(0, size), ...chunkArray(params.slice(size), size)] : [params]

export const buildBatchedRequestBody = (
  params: CryptoRequestParams[],
  config: AdapterConfig<typeof customSettings>,
) => {
  // Coinpaprika supports up to 3 tickers in a single request, so we need to slice it to have 3 element chunks
  const chunkedMatrix = chunkArray(params)

  return chunkedMatrix.map((chunkedParams) => {
    return {
      params: chunkedParams,
      request: {
        baseURL: getApiEndpoint(config),
        url: 'v1/tickers',
        method: 'GET',
        headers: getApiHeaders(config),
        params: {
          quotes: [...new Set(chunkedParams.map((p) => p.quote.toUpperCase()))].join(','),
        },
      },
    }
  })
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
    return {
      params: requestPayload,
      response: {
        errorMessage: `Data for "${requestPayload.quote}" not found for token "${coinId}`,
        statusCode: 400,
      },
    }
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
