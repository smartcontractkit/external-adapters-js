import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['dominance']

export const inputParameters: InputParameters = {
  market: ['market', 'to', 'quote'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const url = 'global-metrics/quotes/latest'

  const options = {
    ...config.api,
    url,
  }

  const symbol = validator.validated.data.market.toLowerCase()
  const dataKey = `${symbol}_dominance`

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['data', dataKey])
  return Requester.success(jobRunID, response, config.verbose)
}
