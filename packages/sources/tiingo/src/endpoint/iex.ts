import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters, EndpointResultPaths } from '@chainlink/types'

export const supportedEndpoints = ['iex', 'stock']

export const endpointResultPaths: EndpointResultPaths = {
  iex: 'tngoLast',
  stock: 'tngoLast',
}

export const inputParameters: InputParameters = {
  ticker: ['ticker', 'base', 'from', 'coin'],
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const ticker = validator.validated.data.ticker
  const resultPath = validator.validated.data.resultPath
  const url = `iex/${ticker}`
  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      tickers: ticker,
    },
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, [0, resultPath])

  return Requester.success(jobRunID, response, config.verbose)
}
