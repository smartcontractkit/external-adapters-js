import { customSettings } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

export interface CryptoRequestParams {
  base: string
  quote: string
  cid?: string
  slug?: string
}

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'sym', 'symbol'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market', 'convert'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
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

interface PriceInfo {
  price: number
  volume_24h: number
  percent_change_1h: number
  percent_change_24h: number
  percent_change_7d: number
  percent_change_30d: number
  market_cap: number
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
        [key: string]: PriceInfo
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
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ProviderResponseBody
  }
}

const groupByBaseOptions = (params: CryptoRequestParams[]) => {
  const id: CryptoRequestParams[] = []
  const slug: CryptoRequestParams[] = []
  const symbol: CryptoRequestParams[] = []
  params.forEach((param) => {
    let optionContainer = []
    if (param.cid) {
      optionContainer = id
    } else if (param.slug) {
      optionContainer = slug
    } else if (param.base) {
      optionContainer = symbol
    }
    optionContainer.push(param)
  })
  return Object.entries({ id, slug, symbol })
}

export const buildBatchedRequestBody = (params: CryptoRequestParams[], endpoint: string) => {
  //Coinmarketcap supports 3 different options for sending base params (id) - 'cid', 'slug' and 'base'. We group here to send batch requests for each such option
  const groupedParams = groupByBaseOptions(params)

  return groupedParams.map((group) => {
    const queryName = group[0]
    const groupedParams = group[1]

    return {
      params: groupedParams,
      request: {
        baseURL: endpoint,
        url: '/cryptocurrency/quotes/latest',
        params: {
          [queryName]: [...new Set(groupedParams.map((p) => p.cid || p.slug || p.base))].join(','),
          convert: [...new Set(groupedParams.map((p) => p.quote))].join(','),
        },
      },
    }
  })
}

// CMC API currently uses ID as key in response, when querying with "slug" param
const _keyForSlug = (data: ProviderResponseBody, slug: string) => {
  if (!data || !data.data) return
  // First try to find slug key in response (in case the API starts returning keys correctly)
  if (Object.keys(data.data).includes(slug)) return slug
  // Fallback to ID
  const _iEqual = (s1: string, s2: string) => s1.toUpperCase() === s2.toUpperCase()
  const o = Object.values(data.data).find((o) => _iEqual(o.slug, slug))

  return o && o.id
}

export const constructEntry = (
  params: CryptoRequestParams[],
  response: ProviderResponseBody,
  resultPath: keyof PriceInfo,
) => {
  return params.map((param) => {
    let key: string | number | undefined = param.cid
    if (!key && param.slug) {
      key = _keyForSlug(response, param.slug)
    }
    if (!key) {
      key = param.base
    }

    let result

    try {
      result = response.data[key].quote[param.quote][resultPath]
    } catch (_) {
      return {
        params: param,
        response: {
          statusCode: 400,
          errorMessage:
            'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
        },
      }
    }
    return {
      params: param,
      response: {
        result,
        data: {
          result,
        },
      },
    }
  })
}
