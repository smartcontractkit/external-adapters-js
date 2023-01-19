import { customSettings } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

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

// Coin IDs fetched from the ID map: https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyMap
const presetIds: { [symbol: string]: number } = {
  '1INCH': 8104,
  AAVE: 7278,
  BAL: 5728,
  BAT: 1697,
  BCH: 1831,
  BNB: 1839,
  BNT: 1727,
  BTC: 1,
  COMP: 5692,
  CRO: 3635,
  CRV: 6538,
  ETC: 1321,
  ETH: 1027,
  FNX: 5712,
  FTT: 4195,
  HT: 2502,
  KCS: 2087,
  KLAY: 4256,
  KNC: 1982,
  LEO: 3957,
  LINK: 1975,
  MIM: 162,
  MKR: 1518,
  OHM: 16209,
  OHMV2: 9067,
  OKB: 3897,
  RCN: 2096,
  REN: 2539,
  SNX: 2586,
  STETH: 8085,
  SUSHI: 6758,
  UMA: 5617,
  UNI: 7083,
  WOM: 5328,
  YFI: 5864,
}

type Payload = { payload: CryptoRequestParams; id?: string }

const chunkArray = (params: string[], size = 120): string[][] =>
  params.length > size ? [params.slice(0, size), ...chunkArray(params.slice(size), size)] : [params]

const groupByBaseOptions = (params: CryptoRequestParams[]) => {
  const id: Payload[] = []
  const slug: Payload[] = []
  const symbol: Payload[] = []
  const group: { id?: Payload[]; slug?: Payload[]; symbol?: Payload[] } = {}
  params.forEach((param) => {
    let optionContainer = []
    // We keep original params in payload so that we  don't modify them when there is base-to-id override
    const input: { payload: CryptoRequestParams; id?: string } = { payload: param }

    if (input.payload.base && presetIds[input.payload.base]) {
      input.id = presetIds[input.payload.base].toString()
    }

    if (input.id || input.payload.cid) {
      optionContainer = id
    } else if (input.payload.slug) {
      optionContainer = slug
    } else if (input.payload.base) {
      optionContainer = symbol
    }
    optionContainer.push(input)
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
      const cParams = params.filter((param) => chunk.includes(param.quote))
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
