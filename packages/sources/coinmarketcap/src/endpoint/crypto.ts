import { Requester, Validator, CacheKey, AdapterInputError } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'
import type {
  ExecuteWithConfig,
  Config,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
  AdapterBatchResponse,
} from '@chainlink/ea-bootstrap'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['crypto', 'price', 'marketcap', 'volume']
export const batchablePropertyPath = [{ name: 'base' }, { name: 'convert', limit: 120 }]

export const endpointResultPaths = {
  crypto: 'price',
  price: 'price',
  marketcap: 'market_cap',
  volume: 'volume_24h',
}

export interface ResponseSchema {
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
  RETH: 15060,
}

export const description = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest

**NOTE: the \`price\` endpoint is temporarily still supported, however, is being deprecated. Please use the \`crypto\` endpoint instead.**`

export type TInputParameters = {
  base: string | string[]
  convert: string | string[]
  cid: string
  slug: string
}
export const inputParameters: InputParameters<TInputParameters> = {
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
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  validator: Validator<TInputParameters>,
  resultPath: string,
) => {
  const payload: AdapterBatchResponse = []
  for (const base in response.data.data) {
    const originalBase = validator.overrideReverseLookup(
      AdapterName,
      'overrides',
      response.data.data[base].symbol,
    )
    for (const quote in response.data.data[base].quote) {
      const individualRequest = {
        ...request,
        data: {
          ...request.data,
          base: originalBase.toUpperCase(),
          convert: quote.toUpperCase(),
        },
      }

      const result = Requester.validateResultNumber(response.data, [
        'data',
        base,
        'quote',
        quote,
        resultPath,
      ])

      payload.push([
        CacheKey.getCacheKey(individualRequest, Object.keys(inputParameters)),

        individualRequest,
        result,
      ])
    }
  }

  const results = payload
  response.data.cost = Requester.validateResultNumber<ResponseSchema>(response.data, [
    'status',
    'credit_count',
  ])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, results),
    true,
    batchablePropertyPath,
  )
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const url = 'cryptocurrency/quotes/latest'
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  // CMC allows a coin name to be specified instead of a symbol
  const slug = validator.validated.data.slug
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid || ''
  const convert = validator.validated.data.convert
  if (!config.apiKey && Array.isArray(convert))
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: ' Free CMCPro API only supports a single symbol to convert',
    })
  const resultPath = (validator.validated.data.resultPath || '').toString()

  const params: Record<string, string> = {
    convert: Array.isArray(convert)
      ? convert.map((symbol) => symbol.toUpperCase()).join(',')
      : convert.toUpperCase(),
  }
  if (cid) {
    params.id = cid
  } else if (slug) {
    params.slug = slug
  } else if (Array.isArray(symbol)) {
    let hasIds = true
    const idsForSymbols = symbol.map((symbol) => {
      const idForSymbol = presetIds[symbol]
      if (!idForSymbol) hasIds = false
      return idForSymbol
    })
    if (hasIds) {
      params.id = idsForSymbols.join(',')
    } else {
      params.symbol = symbol.map((s) => s.toUpperCase()).join(',')
    }
  } else {
    const idForSymbol = presetIds[symbol]
    if (idForSymbol) {
      params.id = String(idForSymbol)
    } else {
      params.symbol = symbol.toUpperCase()
    }
  }

  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request<ResponseSchema>(options)
  if (Array.isArray(symbol) || Array.isArray(convert))
    return handleBatchedRequest(jobRunID, request, response, validator, resultPath)

  // CMC API currently uses ID as key in response, when querying with "slug" param
  const _keyForSlug = (data: ResponseSchema, slug: string) => {
    if (!data || !data.data) return
    // First try to find slug key in response (in case the API starts returning keys correctly)
    if (Object.keys(data.data).includes(slug)) return slug
    // Fallback to ID
    const _iEqual = (s1: string, s2: string) => s1.toUpperCase() === s2.toUpperCase()
    const o = Object.values(data.data).find((o) => _iEqual(o.slug, slug))

    return o && o.id
  }

  const key = params.id || _keyForSlug(response.data, params.slug || '') || params.symbol
  const result = Requester.validateResultNumber(response.data, [
    'data',
    key,
    'quote',
    convert,
    resultPath,
  ])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
