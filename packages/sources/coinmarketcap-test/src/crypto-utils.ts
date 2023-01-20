import { customSettings } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import presetIds from './config/presetids.json'

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
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

type Payload = { payload: CryptoRequestParams; id?: string }

const errorResponse = (payload: CryptoRequestParams, message?: string) => {
  return {
    params: payload,
    response: {
      statusCode: 400,
      errorMessage:
        message ||
        'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
    },
  }
}

const chunkArray = (params: string[], size = 120): string[][] =>
  params.length > size ? [params.slice(0, size), ...chunkArray(params.slice(size), size)] : [params]

const groupByBaseOptions = (params: CryptoRequestParams[]) => {
  const id: Payload[] = []
  const slug: Payload[] = []
  const symbol: Payload[] = []
  const group: { id?: Payload[]; slug?: Payload[]; symbol?: Payload[] } = {}
  params.forEach((param) => {
    // We keep original params in payload so that we  don't modify them when there is base-to-id override
    const input: { payload: CryptoRequestParams; id?: string } = { payload: param }

    if (
      input.payload.base &&
      (presetIds as Record<string, number>)[input.payload.base.toUpperCase()]
    ) {
      input.id = (presetIds as Record<string, number>)[input.payload.base.toUpperCase()].toString()
    }

    if (input.id || input.payload.cid) {
      id.push(input)
    } else if (input.payload.slug) {
      slug.push(input)
    } else if (input.payload.base) {
      symbol.push(input)
    }
  })
  if (id.length) {
    group.id = id
  }
  if (slug.length) {
    group.slug = slug
  }
  if (symbol.length) {
    group.symbol = symbol
  }
  return Object.entries(group)
}

export const buildBatchedRequestBody = (
  params: CryptoRequestParams[],
  config: AdapterConfig<typeof customSettings>,
) => {
  //Coinmarketcap supports 3 different options for sending base params - 'id', 'slug' and 'symbol'. We group here to send batch requests for each such option. Each option should not have more than 120 unique quotes.
  const uniqueQuotes = new Set(params.map((p) => p.quote.toUpperCase()))
  const chunkedMatrix = chunkArray([...uniqueQuotes])

  const groupList = chunkedMatrix
    .map((chunk) => {
      const cParams = params.filter((param) => chunk.includes(param.quote.toUpperCase()))
      return groupByBaseOptions(cParams)
    })
    .flat()

  return groupList.map((group) => {
    const queryName = group[0]
    const groupedParams = group[1]

    return {
      params: groupedParams.map((inputParams) => inputParams.payload),
      request: {
        baseURL: config.API_ENDPOINT,
        url: '/cryptocurrency/quotes/latest',
        headers: {
          'X-CMC_PRO_API_KEY': config.API_KEY,
        },
        params: {
          [queryName]: [
            ...new Set(
              groupedParams.map((p) => p.id || p.payload.cid || p.payload.slug || p.payload.base),
            ),
          ].join(','),
          convert: [...new Set(groupedParams.map((p) => p.payload.quote))].join(','),
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

// If there is a base-to-id override in presetId file we need to get the id of coin because that will be in the response
const _keyForSymbol = (data: ProviderResponseBody, symbol: string) => {
  if (data.data[symbol.toUpperCase()]) {
    return symbol.toUpperCase()
  }
  if ((presetIds as Record<string, number>)[symbol.toUpperCase()]) {
    return (presetIds as Record<string, number>)[symbol.toUpperCase()].toString()
  }

  return symbol.toUpperCase()
}

export const constructEntry = (
  params: CryptoRequestParams[],
  response: ProviderResponseBody,
  resultPath: keyof PriceInfo,
) => {
  return params.map((param) => {
    const quote = param.quote.toUpperCase()

    let key: string | number | undefined = param.cid
    if (!key && param.slug) {
      key = _keyForSlug(response, param.slug)
    }
    if (!key) {
      key = _keyForSymbol(response, param.base)
    }

    if (!response.data[key]) {
      return errorResponse(param, `Data for "${param.cid || param.slug || param.base}" not found`)
    }

    const dataForQuote = response.data[key].quote[quote]
    if (!dataForQuote) {
      return errorResponse(
        param,
        `"${dataForQuote}" quote for "${param.cid || param.slug || param.base}" not found`,
      )
    }
    const result = dataForQuote[resultPath]

    if (!result) {
      return errorResponse(
        param,
        `No result for "${resultPath}" found for "${param.cid || param.slug || param.base}/${
          param.quote
        }"`,
      )
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
