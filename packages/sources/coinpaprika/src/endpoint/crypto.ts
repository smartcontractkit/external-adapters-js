import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  AdapterRequest,
  InputParameters,
  AxiosResponse,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoin } from '../util'
import overrides from '../config/symbols.json'

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

interface RequestedData {
  symbol?: string
  coinid?: string
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse,
  requestedData: RequestedData[],
  resultPath: string,
) => {
  const responseData = response.data as ResponseSchema[]
  const payload: [AdapterRequest, number][] = []

  requestedData.forEach(({ coinid, symbol }) => {
    const coin = getCoin(responseData, symbol, coinid)
    if (!coin) {
      throw new Error(`unable to find coin: ${coinid || symbol}`)
    }

    for (const quote in coin.quotes) {
      payload.push([
        {
          ...request,
          data: {
            ...request.data,
            base: coin.symbol.toUpperCase(),
            quote: quote.toUpperCase(),
          },
        },
        Requester.validateResultNumber(coin, ['quotes', quote, resultPath]),
      ])
    }
  })

  // We'll reset the response data to not output the entire CP coins list
  const result = Requester.withResult({ ...response, data: {} }, undefined, payload)
  return Requester.success(jobRunID, result, true, batchablePropertyPath)
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName)
  const requestedQuotes = validator.validated.data.quote
  const coinid = validator.validated.data.coinid as string | undefined
  const symbolToIdOverride = validator.symbolToIdOverride?.[AdapterName.toLowerCase()]

  const url = 'v1/tickers'
  const resultPath = validator.validated.data.resultPath || endpointResultPaths.crypto

  let quotes: string
  if (Array.isArray(requestedQuotes)) {
    quotes = requestedQuotes.map((quote) => quote.toUpperCase()).join(',')
  } else {
    quotes = requestedQuotes.toUpperCase()
  }

  const params = { quotes }
  const options = {
    ...config.api,
    url,
    params,
  }

  if (Array.isArray(symbol)) {
    const requestedData: RequestedData[] = []

    for (let i = 0; i < symbol.length; i++) {
      // if the requested symbol is overridden in the symbolToIdOverride.coinpaprika parameter,
      // use the overriding id instead of the requested symbol or coinid
      if (symbolToIdOverride?.[symbol[i]]) {
        requestedData.push({ coinid: symbolToIdOverride?.[symbol[i]] })
      } else if (symbol[i] !== validator.validated.data.base[i]) {
        requestedData.push({ coinid: symbol[i] })
      } else {
        requestedData.push({ symbol: symbol[i] })
      }
    }

    const response = await Requester.request<ResponseSchema[]>(options)
    return handleBatchedRequest(jobRunID, request, response, requestedData, resultPath)
  }

  // If coinid was provided or base was overridden, that symbol will be fetched
  let coin = coinid || (symbol !== validator.validated.data.base && symbol ? symbol : undefined)

  if (symbolToIdOverride) {
    // get the symbol from the request from either the 'from', 'base' or 'coin' parameter
    const requestedSymbol = request.data.from || request.data.base || request.data.coin
    if (!requestedSymbol) throw new Error("'base', 'from' or 'coin' was not provided.")
    // if the requested symbol has an overriding id provided in the symbolToIdOverride.coinpaprika
    // parameter, use that id instead of the previously specified id or symbol for the 'coin'
    if (symbolToIdOverride[requestedSymbol]) {
      coin = symbolToIdOverride[requestedSymbol]
    }
  }

  const response = await Requester.request<ResponseSchema[]>(options)

  const coinData = getCoin(response.data, symbol, coin)
  if (!coinData) {
    throw new Error(`unable to find coin: ${coin || symbol}`)
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
