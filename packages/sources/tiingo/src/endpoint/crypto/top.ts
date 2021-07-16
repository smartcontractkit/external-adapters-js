import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters, EndpointResultPaths } from '@chainlink/types'

export const supportedEndpoints = ['top']

export const endpointResultPaths: EndpointResultPaths = {
  top: 'lastPrice',
}

export interface ResponseSchema {
  ticker: string
  baseCurrency: string
  quoteCurrency: string
  topOfBookData: {
    askSize: number
    bidSize: number
    lastSaleTimestamp: string
    lastPrice: number
    askPrice: number
    quoteTimestamp: string
    bidExchange: string
    lastSizeNotional: number
    lastExchange: string
    askExchange: string
    bidPrice: number
    lastSize: number
  }[]
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  resultPath: false,
}

// When an invalid symbol is given the response body is empty
const customError = (data: ResponseSchema[]) => !data.length

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote.toLowerCase()
  const resultPath = validator.validated.data.resultPath

  const url = '/tiingo/crypto/top'

  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      tickers: base + quote,
    },
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data as ResponseSchema[], [
    0,
    'topOfBookData',
    0,
    resultPath,
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
