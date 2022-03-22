import { Requester, Validator, Overrider, Logger } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import internalOverrides from '../config/overrides.json'

import { getCoinIds } from '../util'

export const supportedEndpoints = ['crypto', 'price', 'marketcap', 'volume']
export const batchablePropertyPath = [{ name: 'base' }, { name: 'quote' }]

const customError = (data: ResponseSchema) => {
  return Object.keys(data).length === 0
}

const buildResultPath = (path: string) => (request: AdapterRequest) => {
  const validator = new Validator(request, inputParameters)

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

type OverrideToOriginalSymbol = {
  [id: string]: string
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  endpoint: string,
  idToSymbol: OverrideToOriginalSymbol,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const base in response.data) {
    const quoteArray = Array.isArray(request.data.quote) ? request.data.quote : [request.data.quote]
    for (const quote of quoteArray) {
      const originalSymbol = idToSymbol[base]
      if (originalSymbol) {
        const individualRequest = {
          ...request,
          data: {
            ...request.data,
            base: originalSymbol.toUpperCase(),
            quote: quote.toUpperCase(),
          },
        }
        payload.push([
          individualRequest,
          Requester.validateResultNumber(response.data, [
            base,
            endpointResultPaths[endpoint](individualRequest),
          ]),
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
  const validator = new Validator(request, inputParameters, {}, { overrides: internalOverrides })

  const endpoint = validator.validated.data.endpoint
  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid

  let ids: string
  let idToSymbol: OverrideToOriginalSymbol = {}
  if (!coinid) {
    const overrider = new Overrider(
      internalOverrides,
      request.data?.overrides,
      AdapterName,
      jobRunID,
    )
    const [overriddenCoins, remainingSyms] = overrider.performOverrides(base)
    let requestedCoins = overriddenCoins
    if (remainingSyms.length > 0) {
      const coinsResponse = await getCoinIds(context, jobRunID)
      requestedCoins = Overrider.convertRemainingSymbolsToIds(
        overriddenCoins,
        remainingSyms.map((sym) => sym.toLowerCase()),
        coinsResponse,
      )
    }
    ids = Object.values(requestedCoins).join(',')
    idToSymbol = Overrider.invertRequestedCoinsObject(requestedCoins)
  } else {
    ids = Array.isArray(coinid) ? coinid.join(',') : coinid
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
    return handleBatchedRequest(jobRunID, request, response, endpoint, idToSymbol)
  const result = Requester.validateResultNumber(response.data, [ids.toLowerCase(), resultPath])

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
