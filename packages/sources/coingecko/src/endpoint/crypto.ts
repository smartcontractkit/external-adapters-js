import { Requester, Validator, Overrider } from '@chainlink/ea-bootstrap'
import type {
  Config,
  ExecuteWithConfig,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
} from '@chainlink/types'
import { NAME as AdapterName, DEFAULT_ENDPOINT } from '../config'
import overrides from '../config/symbolToSymbolOverrides.json'
import symbolToIdOverrides from '../config/symbolToIdOverrides.json'

import { getCoinIds } from '../util'

export const supportedEndpoints = ['crypto', 'price', 'marketcap', 'volume']
export const batchablePropertyPath = [{ name: 'base' }, { name: 'quote' }]

const customError = (data: ResponseSchema) => {
  return Object.keys(data).length === 0
}

const buildResultPath = (path: string) => (request: AdapterRequest) => {
  const validator = new Validator(
    request,
    inputParameters,
    {},
    {
      overrides,
      symbolToIdOverrides,
    },
  )

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
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**\n' +
  'Overrides can be provided as input parameters, as specified below, or be hardcoded into the `symbolToSymbolOverrides.json` or `symbolToIdOverrides.json` files in the `./src/config folder`.  Overrides specified as input parameters take precedence.  The order of operations for performing overrides is as follows: \n' +
  '1. Evaluate symbol-to-id overrides from input params.\n' +
  '2. Evaluate symbol-to-symbol overrides from input params, ignoring any symbols that were already overridden to ids during step 1.\n' +
  '3. Evaluate symbol-to-id overrides from the input params again in case any symbol-to-symbol overrides introduced a new overridden symbol.\n' +
  '4. Evaluate symbol-to-id overrides specified in `symbolToIdOverrides.json`, ignoring any symbols that were already overridden to ids during step 1 or 3.\n' +
  '5. Evaluate symbol-to-symbol overrides specified in `symbolToSymbolOverrides.json`, ignoring any symbols that were already overridden to ids during step 1, 3 or 4.\n' +
  '6. Evaluate symbol-to-symbol overrides from input params again in case any overriding symbols from `symbolToSymbolOverrides.json` are overridden in the symbol-to-symbol overrides from input params.\n' +
  '7. Evaluate symbol-to-id overrides from the input params again in case any symbol-to-symbol overrides introduced a new overridden symbol.\n' +
  '8. Evaluate symbol-to-id overrides specified in `symbolToIdOverrides.json`, ignoring any symbols that were already overridden to ids during step 1, 3, 4 or 7.\n'

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
  overrides: {
    description:
      'If base provided is found in overrides, that base symbol will be swapped for the symbol provided by the overrides.',
    options: ['{ "coingecko": { "SYMA": "SYMC", "SYMB": "SYMD" } }'],
  },
  symbolToIdOverrides: {
    description:
      'If base is found in symbolToIdOverrides, that will be used and any other overrides will be ignored.',
    options: ['{ "coingecko": { "COINA": "coin-id-override-a", "COINB": "coin-id-override-b" } }'],
  },
}

export interface ResponseSchema {
  [key: string]: Record<string, number>
}

const handleBatchedRequest = (
  jobRunID: string,
  ids: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  validator: Validator,
  endpoint: string,
  idToSymbol: Record<string, string>,
) => {
  const payload: [AdapterRequest, number][] = []
  const quoteArray = Array.isArray(validator.validated.data.quote)
    ? validator.validated.data.quote
    : [validator.validated.data.quote]
  const coinIds = ids.split(',')

  for (const coinId of coinIds) {
    for (const quote of quoteArray) {
      const individualRequest = {
        ...request,
        data: {
          ...request.data,
          base: coinId,
          quote: quote.toUpperCase(),
        },
      }
      // If the inital request used a coinid, add this is the individualRequest.
      // Otherwise, convert from coinid to symbol
      if (validator.validated.data.coinid) {
        individualRequest.data.coinid = coinId
      } else {
        individualRequest.data.symbol = idToSymbol[coinId]
      }
      let path = endpointResultPaths[endpoint](individualRequest)
      // 'endpointResultPaths' does not work as-is when an array of quotes is requested
      // from the 'price' & 'crypto' endpoints.
      // The fix is to add the quote to the path as seen below below.
      if ((endpoint === 'price' || endpoint === 'crypto') && path === '') path = quote.toLowerCase()
      payload.push([
        individualRequest,
        Requester.validateResultNumber(response.data, [coinId, path]),
      ])
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
  const validator = new Validator(
    request,
    inputParameters,
    {},
    {
      overrides,
      symbolToIdOverrides,
    },
  )
  const endpoint = validator.validated.data.endpoint ?? DEFAULT_ENDPOINT
  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid

  let idToSymbol = {}
  // If a coin id was provided in the request, use the coin id.
  // Otherwise, convert all the requested symbols to coin ids.
  let ids = coinid
  if (!ids) {
    const overrider = new Overrider(validator.validated, AdapterName)
    const overrideResult = overrider.performOverrides(base)
    let requestedCoins = overrideResult[0]
    const remainingSymbols = overrideResult[1]
    const coinSymbolsAndIdsFromDataProvider = await getCoinIds(context, jobRunID)
    requestedCoins = overrider.convertRemainingSymbolsToIds(
      remainingSymbols.map((s) => s.toLowerCase()),
      coinSymbolsAndIdsFromDataProvider,
      requestedCoins,
    )
    idToSymbol = Overrider.invertRequestedCoinsObject(requestedCoins)
    ids = Object.values(requestedCoins).join(',')
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

  // if multiple coinids or multiple currency conversions are requested, handleBatchedRequest
  if (ids.includes(',') || Array.isArray(quote))
    return handleBatchedRequest(jobRunID, ids, request, response, validator, endpoint, idToSymbol)
  const result = Requester.validateResultNumber(response.data, [ids.toLowerCase(), resultPath])

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
