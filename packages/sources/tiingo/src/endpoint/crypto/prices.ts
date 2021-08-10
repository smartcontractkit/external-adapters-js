import { Requester, Validator, util } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
} from '@chainlink/types'
import { NAME as AdapterName } from '../../config'

export const supportedEndpoints = ['prices', 'crypto']
export const batchablePropertyPath = [{ name: 'base' }, { name: 'quote' }]

export const endpointResultPaths = {
  prices: 'close',
  crypto: 'close',
}

export interface ResponseSchema {
  ticker: string
  baseCurrency: string
  quoteCurrency: string
  priceData: {
    date: string
    low: number
    volume: number
    volumeNotional: number
    tradesDone: number
    open: number
    high: number
    close: number
  }[]
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  resultPath: string,
  tickers: string[],
) => {
  const responseData = response.data as ResponseSchema[]

  const payload: [AdapterRequest, number][] = []
  for (const ticker of tickers) {
    const tickerData = responseData.find((d) => d.ticker.toLowerCase() === ticker.toLowerCase())
    if (!tickerData) {
      throw new Error(`Unable to find result for ${ticker}`)
    }

    const from = tickerData.baseCurrency
    const to = tickerData.quoteCurrency

    payload.push([
      {
        ...request,
        data: { ...request.data, base: from.toUpperCase(), quote: to.toUpperCase() },
      },
      Requester.validateResultNumber(tickerData, [resultPath]),
    ])
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  resultPath: false,
}

// When an invalid symbol is given the response body is empty
const customError = (data: ResponseSchema[]) => !data.length

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = validator.overrideSymbol(AdapterName)
  const to = validator.validated.data.quote.toLowerCase()
  const tickerArray = []

  for (const fromCurrency of util.formatArray(from)) {
    for (const toCurrency of util.formatArray(to)) {
      tickerArray.push(`${fromCurrency.toLowerCase()}${toCurrency.toLowerCase()}`)
    }
  }
  const tickers = tickerArray.toString()

  const resultPath = validator.validated.data.resultPath || endpointResultPaths.crypto
  const url = '/tiingo/crypto/prices'

  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      tickers,
      resampleFreq: '24hour',
    },
    url,
  }

  const response = await Requester.request(options, customError)

  if (Array.isArray(from) || Array.isArray(to))
    return handleBatchedRequest(jobRunID, request, response, resultPath, tickerArray)

  response.data.result = Requester.validateResultNumber(response.data as ResponseSchema[], [
    0,
    'priceData',
    0,
    resultPath,
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
