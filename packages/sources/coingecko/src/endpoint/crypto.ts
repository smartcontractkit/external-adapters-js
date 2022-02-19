import { Requester, Validator, Logger, CacheKey } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
  AdapterBatchResponse,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import overrides from '../config/symbols.json'

import { getCoinIds, getSymbolsToIds } from '../util'

export const supportedEndpoints = ['crypto', 'price', 'marketcap', 'volume']
export const batchablePropertyPath = [{ name: 'base' }, { name: 'quote' }]

const customError = (data: ResponseSchema) => {
  return Object.keys(data).length === 0
}

const buildResultPath = (path: string) => (request: AdapterRequest) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const quote = validator.validated.data.quote
  if (Array.isArray(quote)) return ''
  return `${quote.toLowerCase()}${path}`
}

export const endpointResultPaths: {
  [endpoint: string]: ReturnType<typeof buildResultPath>
} = {
  price: buildResultPath(''),
  crypto: buildResultPath(''),
  marketcap: buildResultPath('_market_cap'),
  volume: buildResultPath('_24h_vol'),
}

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

export const inputParameters: InputParameters = {
  coinid: {
    description:
      'The CoinGecko id or array of ids of the coin(s) to query (Note: because of current limitations to use a dummy base will need to be supplied)',
    required: false,
  },
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol or array of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
  },
}

export interface ResponseSchema {
  [key: string]: Record<string, number>
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  validator: Validator,
  endpoint: string,
  idToSymbol: Record<string, string>,
) => {
  const payload: AdapterBatchResponse = []
  for (const base in response.data) {
    const quoteArray = Array.isArray(request.data.quote) ? request.data.quote : [request.data.quote]
    for (const quote of quoteArray) {
      const symbol = idToSymbol?.[base]
      if (symbol) {
        const individualRequest = {
          ...request,
          data: {
            ...request.data,
            base: validator.overrideReverseLookup(AdapterName, 'overrides', symbol).toUpperCase(),
            quote: quote.toUpperCase(),
          },
        }
        const result = Requester.validateResultNumber(response.data, [
          base,
          endpointResultPaths[endpoint](individualRequest),
        ])
        payload.push([
          CacheKey.getCacheKey(individualRequest, inputParameters),
          individualRequest,
          result,
        ])
      } else Logger.debug('WARNING: Symbol not found ', base)
    }
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const endpoint = validator.validated.data.endpoint
  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid
  let idToSymbol = {}
  let ids = coinid
  if (!ids) {
    const coinIds = await getCoinIds(context, jobRunID)
    const symbols = Array.isArray(base) ? base : [base]
    idToSymbol = getSymbolsToIds(symbols, coinIds)
    ids = Object.keys(idToSymbol).join(',')
  }

  const url = '/simple/price'
  const resultPath: string = validator.validated.data.resultPath

  const params = {
    ids,
    vs_currencies: Array.isArray(quote) ? quote.join(',') : quote,
    include_market_cap: endpoint === 'marketcap',
    include_24hr_vol: endpoint === 'volume',
    x_cg_pro_api_key: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)

  if (Array.isArray(base) || Array.isArray(quote))
    return handleBatchedRequest(jobRunID, request, response, validator, endpoint, idToSymbol)
  const result = Requester.validateResultNumber(response.data, [ids.toLowerCase(), resultPath])

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
