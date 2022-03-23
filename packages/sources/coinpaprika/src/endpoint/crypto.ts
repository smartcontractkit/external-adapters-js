import { Requester, Validator, Overrider } from '@chainlink/ea-bootstrap'
import { OverrideObj } from '@chainlink/ea-bootstrap/src/lib/modules'
import type {
  ExecuteWithConfig,
  Config,
  AdapterRequest,
  InputParameters,
  AxiosResponse,
  AdapterContext,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoin, getCoinIds } from '../util'
import internalOverrides from '../config/overrides.json'

export const supportedEndpoints = ['crypto', 'price', 'marketcap', 'volume']
export const batchablePropertyPath = [{ name: 'base' }]

export interface ResponseSchema {
  id: string
  name: string
  symbol: string
  rank: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  beta_value: number
  first_data_at: string
  last_updated: string
  quotes: {
    [quote: string]: {
      price: number
      volume_24h: number
      volume_24h_change_24h: number
      market_cap: number
      market_cap_change_24h: number
      percent_change_15m: number
      percent_change_30m: number
      percent_change_1h: number
      percent_change_6h: number
      percent_change_12h: number
      percent_change_24h: number
      percent_change_7d: number
      percent_change_30d: number
      percent_change_1y: number
      ath_price: number
      ath_date: string
      percent_from_price_ath: number
    }
  }
}

export const endpointResultPaths = {
  crypto: 'price',
  marketcap: 'market_cap',
  price: 'price',
  volume: 'volume_24h',
}

export const description = `The \`marketcap\` endpoint fetches market cap of assets, the \`volume\` endpoint fetches 24-hour volume of assets, and the \`crypto\`/\`price\` endpoint fetches current price of asset pairs (https://api.coinpaprika.com/v1/tickers/\`{COIN}\`).

**NOTE: the \`price\` endpoint is temporarily still supported, however, is being deprecated. Please use the \`crypto\` endpoint instead.**`

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
  },
  coinid: {
    description: 'The coin ID (optional to use in place of `base`)',
    required: false,
    type: 'string',
  },
}

type RequestedCoins = {
  [originalSymbol: string]: string
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const base: string[] = Array.isArray(validator.validated.data.base)
    ? validator.validated.data.base
    : [validator.validated.data.base]

  let coinid: string | string[] | undefined = validator.validated.data.coinid

  const requestedQuotes = validator.validated.data.quote
  const resultPath = validator.validated.data.resultPath || endpointResultPaths.crypto

  const quotes = Array.isArray(requestedQuotes)
    ? requestedQuotes.map((quote) => quote.toUpperCase()).join(',')
    : requestedQuotes.toUpperCase()

  const options = {
    ...config.api,
    url: 'v1/tickers',
    params: { quotes },
  }
  const response = await Requester.request<ResponseSchema[]>(options)

  if (Array.isArray(validator.validated.data.base) || Array.isArray(coinid)) {
    if (!coinid) {
      const requestedCoins = await getConvertedCoins(
        jobRunID,
        base,
        request.data.overrides,
        context,
      )
      return handleBatchedRequest(jobRunID, request, response, requestedCoins, resultPath)
    }
    coinid = Array.isArray(coinid) ? coinid : [coinid]
    return handleBatchedRequest(jobRunID, request, response, coinid, resultPath)
  }

  let coin: string
  if (coinid) {
    coin = coinid
  } else {
    const requestedCoin = await getConvertedCoins(jobRunID, base, request.data.overrides, context)
    coin = Object.values(requestedCoin)[0]
  }

  const coinData = getCoin(response.data, undefined, coin)
  if (!coinData) {
    throw new Error(`unable to find coin: ${coin}`)
  }

  const result = Requester.validateResultNumber(coinData, [
    'quotes',
    requestedQuotes.toUpperCase(),
    resultPath,
  ])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}

const getConvertedCoins = async (
  jobRunID: string,
  base: string | string[],
  inputOverrides: OverrideObj,
  context: AdapterContext,
): Promise<RequestedCoins> => {
  const overrider = new Overrider(internalOverrides, inputOverrides, AdapterName, jobRunID)
  const [overriddenCoins, remainingSyms] = overrider.performOverrides(base)
  let requestedCoins = overriddenCoins
  if (remainingSyms.length > 0) {
    const coinsResponse = await getCoinIds(context, jobRunID)
    requestedCoins = Overrider.convertRemainingSymbolsToIds(
      overriddenCoins,
      remainingSyms.map((sym) => sym.toUpperCase()),
      coinsResponse,
    )
  }
  return requestedCoins
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse,
  requestedCoins: RequestedCoins | RequestedCoinIds,
  resultPath: string,
) => {
  const responseData = response.data as ResponseSchema[]
  const payload: [AdapterRequest, number][] = []

  let requestedIds: RequestedCoinIds = []
  let idsToSymbols: OverrideToOriginalSymbol = {}
  if (isRequestedCoinIds(requestedCoins)) {
    requestedIds = requestedCoins
  } else {
    idsToSymbols = Overrider.invertRequestedCoinsObject(requestedCoins)
    requestedIds = Object.values(requestedCoins)
  }

  requestedIds.forEach((coinid) => {
    const coin = getCoin(responseData, undefined, coinid)
    if (!coin) {
      throw new Error(`unable to find coin: ${coinid}`)
    }

    for (const quote in coin.quotes) {
      const adapterRequest = {
        ...request,
        data: {
          ...request.data,
          quote: quote.toUpperCase(),
        },
      }
      if (isRequestedCoinIds(requestedCoins)) {
        adapterRequest.data.base = coinid
      } else {
        adapterRequest.data.base = idsToSymbols[coinid].toUpperCase()
      }
      payload.push([
        adapterRequest,
        Requester.validateResultNumber(coin, ['quotes', quote, resultPath]),
      ])
    }
  })

  // We'll reset the response data to not output the entire CP coins list
  const result = Requester.withResult({ ...response, data: {} }, undefined, payload)
  return Requester.success(jobRunID, result, true, batchablePropertyPath)
}

type OverrideToOriginalSymbol = {
  [id: string]: string
}

type RequestedCoinIds = string[]

const isRequestedCoinIds = (requestedCoinIds: unknown): requestedCoinIds is RequestedCoinIds => {
  return (
    Array.isArray(requestedCoinIds) &&
    (requestedCoinIds.length === 0 || typeof requestedCoinIds[0] === 'string')
  )
}
