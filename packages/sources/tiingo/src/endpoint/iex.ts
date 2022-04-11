import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters, EndpointResultPaths } from '@chainlink/types'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['iex', 'stock']

export const endpointResultPaths: EndpointResultPaths = {
  iex: 'tngoLast',
  stock: 'tngoLast',
}

export const description = 'https://api.tiingo.com/documentation/iex'

export const inputParameters: InputParameters = {
  ticker: ['ticker', 'base', 'from', 'coin'],
  resultPath: false,
}

interface ResponseSchema {
  prevClose: number
  last: number
  lastSaleTimestamp: string
  low: number
  bidSize: number
  askPrice: number
  open: number
  mid: number
  volume: number
  lastSize: number
  tngoLast: number
  ticker: string
  askSize: number
  quoteTimestamp: string
  bidPrice: number
  timestamp: string
  high: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const ticker = validator.validated.data.ticker
  const resultPath = validator.validated.data.resultPath
  const url = util.buildUrlPath('iex/:ticker', { ticker })
  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      tickers: ticker,
    },
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(options)
  const result = Requester.validateResultNumber(response.data, [0, resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
