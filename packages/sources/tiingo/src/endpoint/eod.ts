import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters, EndpointResultPaths } from '@chainlink/types'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['eod']

export const endpointResultPaths: EndpointResultPaths = {
  eod: 'close',
}

export const description = 'https://api.tiingo.com/documentation/end-of-day'

export const inputParameters: InputParameters = {
  ticker: ['ticker', 'base', 'from', 'coin'],
  resultPath: false,
}

interface ResponseSchema {
  adjClose: number
  adjHigh: number
  adjLow: number
  adjOpen: number
  adjVolume: number
  close: number
  date: string
  divCash: number
  high: number
  low: number
  open: number
  splitFactor: number
  volume: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const ticker = validator.validated.data.ticker
  const resultPath = validator.validated.data.resultPath
  const url = util.buildUrlPath(`/tiingo/daily/:ticker/prices`, { ticker: ticker.toLowerCase() })

  const reqConfig = {
    ...config.api,
    params: {
      token: config.apiKey,
    },
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(reqConfig)
  const result = Requester.validateResultNumber(response.data, [0, resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
