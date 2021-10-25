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

export const supportedEndpoints = ['crypto', 'price', 'marketcap', 'volume']
export const batchablePropertyPath = [{ name: 'base' }, { name: 'quote' }]

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

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  resultPath: false,
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
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName)
  const requestedQuotes = validator.validated.data.quote
  const coinid = validator.validated.data.coinid as string | undefined

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
      if (symbol[i] !== validator.validated.data.base[i]) {
        requestedData.push({ coinid: symbol[i] })
      } else {
        requestedData.push({ symbol: symbol[i] })
      }
    }

    const response = await Requester.request<ResponseSchema[]>(options)
    return handleBatchedRequest(jobRunID, request, response, requestedData, resultPath)
  }

  // If coinid was provided or base was overridden, that symbol will be fetched
  const coin = coinid || (symbol !== validator.validated.data.base && symbol ? symbol : undefined)

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
