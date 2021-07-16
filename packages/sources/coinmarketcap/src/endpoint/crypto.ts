import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'
import {
  ExecuteWithConfig,
  Config,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
} from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'price', 'marketcap']

export const endpointResultPaths = {
  crypto: 'price',
  price: 'price',
  marketcap: 'market_cap',
}

// Coin IDs fetched from the ID map: https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyMap
const presetIds: { [symbol: string]: number } = {
  COMP: 5692,
  BNT: 1727,
  RCN: 2096,
  UNI: 7083,
  CRV: 6538,
  FNX: 5712,
  ETC: 1321,
  BAT: 1697,
  CRO: 3635,
  LEO: 3957,
  FTT: 4195,
  HT: 2502,
  OKB: 3897,
  KCS: 2087,
  BTC: 1,
  ETH: 1027,
  BNB: 1839,
  LINK: 1975,
  BCH: 1831,
  MKR: 1518,
  AAVE: 7278,
  UMA: 5617,
  SNX: 2586,
  RAI2: 8525,
  REN: 2539,
  KNC: 1982,
  SUSHI: 6758,
  YFI: 5864,
  BAL: 5728,
  '1INCH': 8104,
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  cid: false,
  slug: false,
  resultPath: false,
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse,
  resultPath: string,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const base in response.data.data) {
    for (const quote in response.data.data[base].quote) {
      payload.push([
        {
          ...request,
          data: {
            ...request.data,
            base: response.data.data[base].symbol.toUpperCase(),
            convert: quote.toUpperCase(),
          },
        },
        Requester.validateResultNumber(response.data, ['data', base, 'quote', quote, resultPath]),
      ])
    }
  }

  response.data.results = payload
  response.data.cost = Requester.validateResultNumber(response.data, ['status', 'credit_count'])
  return Requester.success(jobRunID, response, true, ['base', 'convert'])
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const url = 'cryptocurrency/quotes/latest'
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName)
  // CMC allows a coin name to be specified instead of a symbol
  const slug = validator.validated.data.slug
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid || ''
  const convert = validator.validated.data.convert
  if (!config.apiKey && Array.isArray(convert))
    throw new Error(' Free CMCPro API only supports a single symbol to convert')
  const resultPath = validator.validated.data.resultPath
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
  const response = await Requester.request(options)

  if (Array.isArray(symbol) || Array.isArray(convert))
    return handleBatchedRequest(jobRunID, request, response, resultPath)

  // CMC API currently uses ID as key in response, when querying with "slug" param
  const _keyForSlug = (data: any, slug: string) => {
    if (!data || !data.data) return
    // First try to find slug key in response (in case the API starts returning keys correctly)
    if (Object.keys(data.data).includes(slug)) return slug
    // Fallback to ID
    const _iEqual = (s1: string, s2: string) => s1.toUpperCase() === s2.toUpperCase()
    const o: any = Object.values(data.data).find((o: any) => _iEqual(o.slug, slug))
    return o && o.id
  }

  const key = params.id || _keyForSlug(response.data, params.slug || '') || params.symbol

  response.data.result = Requester.validateResultNumber(response.data, [
    'data',
    key,
    'quote',
    convert,
    resultPath,
  ])
  return Requester.success(jobRunID, response, config.verbose, ['base', 'convert'])
}
