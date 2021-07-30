import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['globalmarketcap']

export const inputParameters: InputParameters = {
  market: ['market', 'to', 'quote'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const convert = validator.validated.data.market.toUpperCase()
  const url = '/global-metrics/quotes/latest'

  const params = { convert }

  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, [
    'data',
    'quote',
    convert,
    'total_market_cap',
  ])
  return Requester.success(jobRunID, response, config.verbose)
}
