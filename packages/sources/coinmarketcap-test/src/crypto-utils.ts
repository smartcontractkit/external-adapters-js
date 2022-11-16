import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { HttpRequestConfig } from '@chainlink/external-adapter-framework/transports'
import { customSettings } from './config'

export interface CryptoRequestParams {
  base: string
  convert: string
  cid?: string
  slug?: string
}

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'sym', 'symbol'],
    description: 'The symbol of the currency to query',
    required: true,
  },
  convert: {
    aliases: ['quote', 'to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
  },
  cid: {
    description: 'The CMC coin ID (optional to use in place of base)',
    required: false,
    type: 'string',
  },
  slug: {
    description: 'The CMC coin ID (optional to use in place of base)',
    required: false,
    type: 'string',
  },
} as const

export interface ProviderRequestBody {
  ids: string
  vs_currencies: string
  include_market_cap?: boolean
  include_24hr_vol?: boolean
}

export interface ProviderResponseBody {
  data: {
    [key: string]: {
      id: number
      name: string
      symbol: string
      slug: string
      is_active: number
      is_fiat: number
      circulating_supply: number
      total_supply: number
      max_supply: number
      date_added: string
      num_market_pairs: number
      cmc_rank: number
      last_updated: string
      tags: string[]
      platform: string
      quote: {
        [key: string]: {
          price: number
          volume_24h: number
          percent_change_1h: number
          percent_change_24h: number
          percent_change_7d: number
          percent_change_30d: number
          market_cap: number
          last_updated: string
        }
      }
    }
  }
  status: {
    timestamp: string
    error_code: number
    error_message: string
    elapsed: number
    credit_count: number
  }
  cost: number
}

export type CryptoEndpointTypes = {
  Request: {
    Params: CryptoRequestParams
  }
  Response: {
    Data: ProviderResponseBody
    Result: number
  }
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ProviderResponseBody
  }
}

export const buildBatchedRequestBody = (
  params: CryptoRequestParams[],
  config: AdapterConfig,
): HttpRequestConfig<ProviderRequestBody> => {
  return {
    baseURL: config.API_ENDPOINT,
    url: '/cryptocurrency/quotes/latest',
    params: {
      id: [...new Set(params.map((p) => p.cid || p.slug || p.base))].join(','),
      convert: [...new Set(params.map((p) => p.convert))].join(','),
    },
  }
}
