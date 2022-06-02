import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  EndpointResultPaths,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../../config'
import overrides from '../../config/symbols.json'

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

export const description =
  'The top of order book endpoint from https://api.tiingo.com/documentation/crypto'

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    description: 'The cryptocurrency symbol to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    description: 'The output currency to return the price in',
  },
}

// When an invalid symbol is given the response body is empty
const customError = (data: ResponseSchema[]) => !data.length

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  const quote = validator.validated.data.quote.toLowerCase()
  const resultPath = (validator.validated.data.resultPath || '').toString()

  const url = '/tiingo/crypto/top'

  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      tickers: base + quote,
    },
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(options, customError)
  const result = Requester.validateResultNumber(response.data[0], ['topOfBookData', 0, resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
