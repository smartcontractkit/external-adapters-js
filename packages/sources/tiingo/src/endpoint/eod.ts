import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters, EndpointResultPaths } from '@chainlink/types'

export const supportedEndpoints = ['eod']

export const endpointResultPaths: EndpointResultPaths = {
  eod: 'close',
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
  const url = `/tiingo/daily/${ticker.toLowerCase()}/prices`

  const reqConfig = {
    ...config.api,
    params: {
      token: config.apiKey,
    },
    url,
  }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, [0, resultPath])

  return Requester.success(jobRunID, response, config.verbose)
}
