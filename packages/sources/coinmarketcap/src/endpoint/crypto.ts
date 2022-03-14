import { Requester, Validator, Overrider, AdapterError } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'
import {
  ExecuteWithConfig,
  Config,
  AxiosResponse,
  AdapterResponse,
  AdapterRequest,
  InputParameters,
} from '@chainlink/types'
import overrides from '../config/symbolToSymbolOverrides.json'
import symbolToIdOverrides from '../config/symbolToIdOverrides.json'

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
}

export const description = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest

**NOTE: the \`price\` endpoint is temporarily still supported, however, is being deprecated. Please use the \`crypto\` endpoint instead.**`

export const inputParameters: InputParameters = {
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
  resultPath: string,
  idsToSymbols: { [id: string]: string },
): AdapterResponse => {
  const payload: [AdapterRequest, number][] = []
  for (const base in response.data.data) {
    const originalBase = idsToSymbols[base]
    for (const quote in response.data.data[base].quote) {
      payload.push([
        {
          ...request,
          data: {
            ...request.data,
            base: originalBase.toUpperCase(),
            convert: quote.toUpperCase(),
          },
        },
        Requester.validateResultNumber(response.data, ['data', base, 'quote', quote, resultPath]),
      ])
    }
  }

  const results = payload
  response.data.cost = Requester.validateResultNumber(response.data, ['status', 'credit_count'])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, results),
    true,
    batchablePropertyPath,
  )
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const url = 'cryptocurrency/quotes/latest'
  const validator = new Validator(request, inputParameters, {}, { overrides, symbolToIdOverrides })
  const jobRunID = validator.validated.id

  // CMC allows a coin name to be specified instead of a symbol
  const slug = validator.validated.data.slug
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid || ''
  const convert = validator.validated.data.convert
  if (!config.apiKey && Array.isArray(convert))
    throw Error(' Free CMCPro API only supports a single symbol to convert')

  const resultPath = validator.validated.data.resultPath
  const params: Record<string, string> = {
    convert: Array.isArray(convert)
      ? convert.map((symbol) => symbol.toUpperCase()).join(',')
      : convert.toUpperCase(),
  }

  let idsToSymbols = invertObj(symbolToIdOverrides.coinmarketcap)
  if (cid) {
    params.id = cid
  } else if (slug) {
    params.slug = slug
  } else {
    const overrider = new Overrider(validator.validated, AdapterName)
    const [requestedCoins, remainingSymbols] = overrider.performOverrides(
      validator.validated.data.base,
    )
    if (remainingSymbols.length > 0)
      throw new AdapterError({
        message: 'A symbol was requested that does not a matching id specified in the overrides.',
      })
    idsToSymbols = Overrider.invertRequestedCoinsObject(requestedCoins)
    params.id = Object.values(requestedCoins).join(',')
  }

  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request<ResponseSchema>(options)

  if (
    Array.isArray(validator.validated.data.base) ||
    Array.isArray(validator.validated.data.convert)
  )
    return handleBatchedRequest(jobRunID, request, response, resultPath, idsToSymbols)

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

const invertObj = (obj: { [key: string]: string }): { [key: string]: string } => {
  const inverted = {} as { [key: string]: string }
  for (const key of Object.keys(obj)) {
    inverted[obj[key]] = key
  }
  return inverted
}
